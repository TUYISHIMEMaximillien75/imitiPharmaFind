import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from './entities/medicine.entity';

@Injectable()
export class MedicinesService {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepo: Repository<Medicine>,
  ) {}

  findAll() {
    return this.medicineRepo.find({ order: { name: 'ASC' } });
  }

  create(data: Partial<Medicine>) {
    const medicine = this.medicineRepo.create(data);
    return this.medicineRepo.save(medicine);
  }

  async update(id: string, data: Partial<Medicine>) {
    const medicine = await this.medicineRepo.findOne({ where: { id } });
    if (!medicine) throw new NotFoundException(`Medicine #${id} not found`);
    await this.medicineRepo.update(id, data);
    return this.medicineRepo.findOne({ where: { id } });
  }
}
