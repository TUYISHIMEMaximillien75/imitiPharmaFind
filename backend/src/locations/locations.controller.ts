import { Controller, Get, Query, Param } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationService: LocationService) {}

  /** Top-level provinces */
  @Get('provinces')
  async getProvinces() {
    return this.locationService.getNodes();
  }

  /** Direct children of a given node */
  @Get('children')
  async getChildren(@Query('parentId') parentId: string) {
    return this.locationService.getChildren(parentId);
  }

  @Get('hierarchy')
  async getHierarchy(@Query('parentId') parentId?: string) {
    return this.locationService.getNodes(parentId);
  }

  @Get('all')
  async getAll() {
    return this.locationService.getAllNodes();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.locationService.getNodeById(id);
  }
}
