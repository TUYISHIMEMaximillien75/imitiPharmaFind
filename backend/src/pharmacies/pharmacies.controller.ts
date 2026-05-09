import {
  Controller, Get, Patch, Param, Body, UseGuards, Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PharmaciesService } from './pharmacies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('pharmacies')
@ApiBearerAuth('JWT')
@Controller('pharmacies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmaciesController {
  constructor(private readonly pharmaciesService: PharmaciesService) {}

  /** Admin: get all pharmacies (optionally filter by status) */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  findAll(@Request() req: any) {
    if (req.user.role === UserRole.ADMIN) {
      return this.pharmaciesService.findAll();
    }
    // Pharmacist can only see their own
    return this.pharmaciesService.findByOwner(req.user.id);
  }

  /** Get single pharmacy */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.pharmaciesService.findOne(id);
  }

  /** Pharmacist update their own pharmacy profile */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const pharmacy = await this.pharmaciesService.findOne(id);
    // Pharmacists can only edit their own
    if (req.user.role === UserRole.PHARMACIST && pharmacy.owner?.id !== req.user.id) {
      throw new ForbiddenException('You can only update your own pharmacy');
    }
    return this.pharmaciesService.update(id, body);
  }

  /** Admin: approve pharmacy */
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(@Param('id') id: string) {
    return this.pharmaciesService.approve(id);
  }

  /** Admin: reject pharmacy */
  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.pharmaciesService.reject(id, reason);
  }
}
