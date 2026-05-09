import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Pharmacy } from '../pharmacies/entities/pharmacy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy])],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
