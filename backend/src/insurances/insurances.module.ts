import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insurance } from './entities/insurance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Insurance])],
  exports: [TypeOrmModule],
})
export class InsurancesModule {}
