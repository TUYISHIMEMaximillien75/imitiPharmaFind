import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { PharmaciesController } from './pharmacies.controller';
import { PharmaciesService } from './pharmacies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy])],
  controllers: [PharmaciesController],
  providers: [PharmaciesService],
  exports: [PharmaciesService],
})
export class PharmaciesModule {}
