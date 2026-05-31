import {
  Controller, Get, Patch, Post, Delete, Param, Body,
  UseGuards, Request, ForbiddenException, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
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

  /** Pharmacist: upload license document (PDF or image) */
  @Post(':id/upload-license')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACIST, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('licenseDocument', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `license-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(pdf|jpg|jpeg|png|gif|webp)$/i;
        if (!allowed.test(file.originalname)) {
          return cb(new BadRequestException('Only PDF and image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadLicense(
    @Param('id') pharmacyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    await this.ensureOwnerOrAdmin(pharmacyId, req);
    const url = `/uploads/${file.filename}`;
    return this.pharmaciesService.update(pharmacyId, { licenseDocumentUrl: url } as any);
  }
}
