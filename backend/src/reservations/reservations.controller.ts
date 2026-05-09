import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('reservations')
@ApiBearerAuth('JWT')
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /** Patient: create a reservation */
  @Post()
  @Roles(UserRole.PATIENT)
  create(@Request() req: any, @Body() body: CreateReservationDto) {
    return this.reservationsService.create(req.user.id, body);
  }


  /** Patient: get own reservations | Pharmacist: get their pharmacy's reservations */
  @Get()
  @Roles(UserRole.PATIENT, UserRole.PHARMACIST, UserRole.ADMIN)
  findAll(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    if (req.user.role === UserRole.PHARMACIST) {
      return this.reservationsService.findByPharmacist(req.user.id, p, l);
    }
    if (req.user.role === UserRole.ADMIN) {
      return this.reservationsService.findAll(p, l);
    }
    return this.reservationsService.findByPatient(req.user.id, p, l);
  }

  /** Get single reservation */
  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.PHARMACIST, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  /** Pharmacist: confirm a reservation */
  @Patch(':id/confirm')
  @Roles(UserRole.PHARMACIST)
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.reservationsService.confirm(id, req.user.id);
  }

  /** Pharmacist: mark a confirmed reservation as completed (medicine picked up / delivered) */
  @Patch(':id/complete')
  @Roles(UserRole.PHARMACIST)
  complete(@Param('id') id: string, @Request() req: any) {
    return this.reservationsService.complete(id, req.user.id);
  }

  /** Pharmacist: reject a reservation (must provide reason) */
  @Patch(':id/reject')
  @Roles(UserRole.PHARMACIST)
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.reservationsService.reject(id, reason, req.user.id);
  }


  /** Patient: cancel their own reservation */
  @Patch(':id/cancel')
  @Roles(UserRole.PATIENT)
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.reservationsService.cancel(id, req.user.id);
  }
}
