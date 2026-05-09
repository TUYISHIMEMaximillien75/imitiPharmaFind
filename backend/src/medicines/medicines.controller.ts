import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('medicines')
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  /** Public: global medicine catalogue for search autocomplete */
  @Get()
  findAll() {
    return this.medicinesService.findAll();
  }

  /** Admin only: add a medicine to the global catalogue */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() body: any) {
    return this.medicinesService.create(body);
  }

  /** Admin only: update a medicine */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.medicinesService.update(id, body);
  }
}
