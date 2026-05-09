import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insurance } from './entities/insurance.entity';

@Controller('insurances')
export class InsurancesController {
  constructor(
    @InjectRepository(Insurance)
    private readonly insuranceRepo: Repository<Insurance>,
  ) {}

  /** Public: list all insurance providers for the patient search form */
  @Get()
  findAll() {
    return this.insuranceRepo.find({ order: { providerName: 'ASC' } });
  }
}
