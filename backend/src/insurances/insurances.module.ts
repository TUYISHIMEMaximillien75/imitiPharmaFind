import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insurance } from './entities/insurance.entity';
import { InsurancesController } from './insurances.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Insurance])],
  controllers: [InsurancesController],
  exports: [TypeOrmModule],
})
export class InsurancesModule {}

