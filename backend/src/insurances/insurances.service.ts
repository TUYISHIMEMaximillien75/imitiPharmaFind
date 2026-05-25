import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insurance } from './entities/insurance.entity';

@Injectable()
export class InsurancesService {
  constructor(
    @InjectRepository(Insurance)
    private readonly insuranceRepo: Repository<Insurance>,
  ) {}

  findAll() {
    return this.insuranceRepo.find({ order: { providerName: 'ASC' } });
  }

  async findOne(id: string) {
    const ins = await this.insuranceRepo.findOne({ where: { id } });
    if (!ins) throw new NotFoundException(`Insurance #${id} not found`);
    return ins;
  }

  async create(data: { providerName: string; defaultCoveragePercentage?: number }) {
    const existing = await this.insuranceRepo.findOne({ where: { providerName: data.providerName } });
    if (existing) throw new ConflictException(`Insurance "${data.providerName}" already exists`);
    const ins = this.insuranceRepo.create(data);
    return this.insuranceRepo.save(ins);
  }

  async update(id: string, data: Partial<Insurance>) {
    await this.findOne(id);
    await this.insuranceRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const ins = await this.findOne(id);
    return this.insuranceRepo.remove(ins);
  }
}
