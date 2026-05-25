import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InsurancesService } from './insurances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('insurances')
@Controller('insurances')
export class InsurancesController {
  constructor(private readonly insurancesService: InsurancesService) {}

  /** Public: list all insurance providers for patient search & pharmacist UI */
  @Get()
  findAll() {
    return this.insurancesService.findAll();
  }

  /** Admin only: add a new insurance provider */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  create(@Body() body: { providerName: string; defaultCoveragePercentage?: number }) {
    return this.insurancesService.create(body);
  }

  /** Admin only: update coverage % or name */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  update(@Param('id') id: string, @Body() body: any) {
    return this.insurancesService.update(id, body);
  }

  /** Admin only: remove an insurance provider */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  remove(@Param('id') id: string) {
    return this.insurancesService.remove(id);
  }
}
