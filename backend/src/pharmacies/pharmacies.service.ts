import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pharmacy, PharmacyStatus } from './entities/pharmacy.entity';

@Injectable()
export class PharmaciesService {
  constructor(
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepo: Repository<Pharmacy>,
  ) {}

  findAll() {
    return this.pharmacyRepo.find({
      relations: ['owner', 'insurances'],
      order: { createdAt: 'DESC' },
    });
  }

  findByOwner(userId: string) {
    return this.pharmacyRepo.find({
      where: { owner: { id: userId } },
      relations: ['insurances', 'inventory'],
    });
  }

  async findOne(id: string) {
    const pharmacy = await this.pharmacyRepo.findOne({
      where: { id },
      relations: ['owner', 'insurances', 'inventory'],
    });
    if (!pharmacy) throw new NotFoundException(`Pharmacy #${id} not found`);
    return pharmacy;
  }

  async update(id: string, data: Partial<Pharmacy>) {
    await this.pharmacyRepo.update(id, data);
    return this.findOne(id);
  }

  async approve(id: string) {
    await this.pharmacyRepo.update(id, {
      status: PharmacyStatus.ACTIVE,
      isActive: true,
      rejectionReason: null,
    });
    return this.findOne(id);
  }

  async reject(id: string, reason: string) {
    await this.pharmacyRepo.update(id, {
      status: PharmacyStatus.REJECTED,
      isActive: false,
      rejectionReason: reason,
    });
    return this.findOne(id);
  }
}
