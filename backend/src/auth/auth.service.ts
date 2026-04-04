import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Pharmacy } from '../pharmacies/entities/pharmacy.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Pharmacy)
    private pharmaciesRepository: Repository<Pharmacy>,
    private jwtService: JwtService,
  ) {}

  async register(data: any): Promise<any> {
    const { email, password, role, pharmacyName, licenseNumber } = data;
    
    // Check if user exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ email, passwordHash, role });

    // Link pharmacy if role is PHARMACIST
    if (role === UserRole.PHARMACIST && pharmacyName && licenseNumber) {
      const pharmacy = this.pharmaciesRepository.create({
        name: pharmacyName,
        licenseNumber,
        isActive: false, // Must be approved by admin
      });
      user.pharmacy = pharmacy;
    }

    await this.usersRepository.save(user);

    return { message: 'Registration successful' };
  }

  async login(data: any): Promise<any> {
    const { email, password } = data;
    const user = await this.usersRepository.findOne({ 
      where: { email },
      relations: ['pharmacy']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        pharmacy: user.pharmacy ? {
          id: user.pharmacy.id,
          name: user.pharmacy.name,
          isActive: user.pharmacy.isActive
        } : null
      }
    };
  }
}
