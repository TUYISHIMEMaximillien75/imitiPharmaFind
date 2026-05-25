import {
  Controller, Get, Patch, Post, Delete, Param, Body,
  UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PharmaciesService } from './pharmacies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('pharmacies')
@Controller('pharmacies')
export class PharmaciesController {
  constructor(private readonly pharmaciesService: PharmaciesService) {}

  /** Admin / Pharmacist: list pharmacies */
  @Get()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  findAll(@Request() req: any) {
    if (req.user.role === UserRole.ADMIN) {
      return this.pharmaciesService.findAll();
    }
    return this.pharmaciesService.findByOwner(req.user.id);
  }

  /**
   * FIX Issue #1: Public endpoint — no auth guard so any user (patient, guest)
   * can load a pharmacy detail page.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pharmaciesService.findOnePublic(id);
  }

  /**
   * Real-time approval polling for pharmacists (Issue #4).
   * Returns only { id, status, rejectionReason } — very lightweight.
   */
  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.pharmaciesService.getStatus(id);
  }

  /** Pharmacist update their own pharmacy profile */
  @Patch(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const pharmacy = await this.pharmaciesService.findOne(id);
    if (req.user.role === UserRole.PHARMACIST && pharmacy.owner?.id !== req.user.id) {
      throw new ForbiddenException('You can only update your own pharmacy');
    }
    return this.pharmaciesService.update(id, body);
  }

  /** Admin: approve pharmacy */
  @Patch(':id/approve')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approve(@Param('id') id: string) {
    return this.pharmaciesService.approve(id);
  }

  /** Admin: reject pharmacy */
  @Patch(':id/reject')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.pharmaciesService.reject(id, reason);
  }

  /* ─── Per-pharmacy Insurance endpoints (Issue #7) ─── */

  /** List insurances accepted by this pharmacy (with coverage %) */
  @Get(':id/insurances')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  getInsurances(@Param('id') id: string) {
    return this.pharmaciesService.getPharmacyInsurances(id);
  }

  /** Add / link an insurance to this pharmacy (optional coverage override) */
  @Post(':id/insurances')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async addInsurance(
    @Param('id') pharmacyId: string,
    @Body() body: { insuranceId: string; coveragePercentage?: number },
    @Request() req: any,
  ) {
    await this.ensureOwnerOrAdmin(pharmacyId, req);
    return this.pharmaciesService.addInsurance(pharmacyId, body.insuranceId, body.coveragePercentage);
  }

  /** Update coverage % for an insurance on this pharmacy */
  @Patch(':id/insurances/:insuranceId')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async updateInsurance(
    @Param('id') pharmacyId: string,
    @Param('insuranceId') insuranceId: string,
    @Body('coveragePercentage') coveragePercentage: number,
    @Request() req: any,
  ) {
    await this.ensureOwnerOrAdmin(pharmacyId, req);
    return this.pharmaciesService.updateInsuranceCoverage(pharmacyId, insuranceId, coveragePercentage);
  }

  /** Remove an insurance from this pharmacy */
  @Delete(':id/insurances/:insuranceId')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async removeInsurance(
    @Param('id') pharmacyId: string,
    @Param('insuranceId') insuranceId: string,
    @Request() req: any,
  ) {
    await this.ensureOwnerOrAdmin(pharmacyId, req);
    return this.pharmaciesService.removeInsurance(pharmacyId, insuranceId);
  }

  private async ensureOwnerOrAdmin(pharmacyId: string, req: any) {
    if (req.user.role === UserRole.ADMIN) return;
    const pharmacy = await this.pharmaciesService.findOne(pharmacyId);
    if (pharmacy.owner?.id !== req.user.id) {
      throw new ForbiddenException('You can only manage your own pharmacy');
    }
  }
}
