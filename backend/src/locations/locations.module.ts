import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { LocationsController } from './locations.controller';
import { LocationNode } from './entities/location-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LocationNode])],
  controllers: [LocationsController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationsModule {}
