import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insurance } from './entities/insurance.entity';
import { InsurancesController } from './insurances.controller';
import { InsurancesService } from './insurances.service';

@Module({
  imports: [TypeOrmModule.forFeature([Insurance])],
  controllers: [InsurancesController],
  providers: [InsurancesService],
  exports: [TypeOrmModule, InsurancesService],
})
export class InsurancesModule {}
