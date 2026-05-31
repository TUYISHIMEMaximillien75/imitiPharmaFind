import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationService: LocationService) {}

  @Get('hierarchy')
  async getHierarchy(@Query('parentId') parentId?: string) {
    return this.locationService.getNodes(parentId);
  }

  @Get('all')
  async getAll() {
    return this.locationService.getAllNodes();
  }
}
