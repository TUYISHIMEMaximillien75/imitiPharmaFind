import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['pharmacy', 'insuranceProvider'],
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt', 'insuranceNumber', 'insuranceProviderId', 'isInsuranceVerified'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, data: { firstName?: string; lastName?: string; phone?: string; insuranceNumber?: string; insuranceProviderId?: string }) {
    const updateData: any = { ...data };
    if (data.insuranceNumber !== undefined || data.insuranceProviderId !== undefined) {
      updateData.isInsuranceVerified = false; // reset verification on change
    }
    await this.userRepo.update(id, updateData);
    return this.findById(id);
  }

  async verifyInsurance(id: string) {
    const user = await this.findById(id);
    if (!user.insuranceNumber || !user.insuranceProviderId) {
      throw new Error('Missing insurance details');
    }
    // Mock verification: simply assume valid
    await this.userRepo.update(id, { isInsuranceVerified: true });
    return this.findById(id);
  }
}
