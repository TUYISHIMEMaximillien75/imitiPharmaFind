import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Pharmacy } from '../pharmacies/entities/pharmacy.entity';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pharmacy]),
    LocationsModule
  ],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
