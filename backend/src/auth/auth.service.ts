import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Pharmacy, PharmacyStatus } from '../pharmacies/entities/pharmacy.entity';

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
    const { email, password, role, firstName, lastName, phone, pharmacyName, licenseNumber, address } = data;

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role: role || UserRole.PATIENT,
      firstName,
      lastName,
      phone,
    });

    // Link pharmacy if role is PHARMACIST
    if (role === UserRole.PHARMACIST && pharmacyName && licenseNumber) {
      const pharmacy = this.pharmaciesRepository.create({
        name: pharmacyName,
        licenseNumber,
        address: address || '',
        status: PharmacyStatus.PENDING,
        isActive: false, // Must be approved by admin
      });
      user.pharmacy = pharmacy;
    }

    await this.usersRepository.save(user);

    return { message: 'Registration successful. Please log in.' };
  }

  async login(data: any): Promise<any> {
    const { email, password } = data;
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['pharmacy'],
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
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        pharmacy: user.pharmacy
          ? {
              id: user.pharmacy.id,
              name: user.pharmacy.name,
              status: user.pharmacy.status,
              isActive: user.pharmacy.isActive,
            }
          : null,
      },
    };
  }
  /** Re-issue a fresh token for an already-authenticated user (used by the interceptor) */
  async refresh(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['pharmacy'],
    });
    if (!user) throw new UnauthorizedException('User not found');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        pharmacy: user.pharmacy
          ? {
              id: user.pharmacy.id,
              name: user.pharmacy.name,
              status: user.pharmacy.status,
              isActive: user.pharmacy.isActive,
            }
          : null,
      },
    };
  }
}
