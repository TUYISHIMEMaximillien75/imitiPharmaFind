import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { PharmacyInsurance } from './entities/pharmacy-insurance.entity';
import { Insurance } from '../insurances/entities/insurance.entity';
import { PharmaciesController } from './pharmacies.controller';
import { PharmaciesService } from './pharmacies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy, PharmacyInsurance, Insurance])],
  controllers: [PharmaciesController],
  providers: [PharmaciesService],
  exports: [PharmaciesService, TypeOrmModule],
})
export class PharmaciesModule {}
