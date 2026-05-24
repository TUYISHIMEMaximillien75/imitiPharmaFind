import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus, PaymentStatus } from './entities/reservation.entity';

import { ReservationItem } from './entities/reservation-item.entity';
import { Pharmacy } from '../pharmacies/entities/pharmacy.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReservationItem)
    private readonly itemRepo: Repository<ReservationItem>,
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepo: Repository<Pharmacy>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(patientId: string, data: {
    pharmacyId: string;
    items: { medicineId: string; quantity: number }[];
    prescriptionImageUrl?: string;
    notes?: string;
    paymentMethod?: any;
    deliveryOption?: any;
    deliveryAddress?: string;
    deliveryDistanceKm?: number;
  }) {
    let totalAmount = 0;
    const reservationItems: Partial<ReservationItem>[] = [];

    for (const item of data.items) {
      const invItem = await this.inventoryRepo.findOne({
        where: { pharmacyId: data.pharmacyId, medicineId: item.medicineId },
      });
      if (!invItem) throw new BadRequestException(`Medicine not found in pharmacy stock`);
      if (invItem.stock < item.quantity) throw new BadRequestException(`Insufficient stock`);

      reservationItems.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        priceAtReservation: Number(invItem.price),
      });
      totalAmount += Number(invItem.price) * item.quantity;
    }

    // 1. Check insurance logic
    const patient = await this.userRepo.findOne({
      where: { id: patientId },
      relations: ['insuranceProvider'],
    });

    const pharmacy = await this.pharmacyRepo.findOne({
      where: { id: data.pharmacyId },
      relations: ['pharmacyInsurances', 'pharmacyInsurances.insurance'],
    });

    if (!pharmacy) throw new BadRequestException(`Pharmacy not found`);

    let insurancePays = 0;
    if (patient?.isInsuranceVerified && patient.insuranceProvider) {
      const pi = pharmacy.pharmacyInsurances?.find(
        (p) => p.insurance?.id === patient.insuranceProvider.id,
      );
      if (pi) {
        const coverage = Number(pi.coveragePercentage ?? pi.insurance?.defaultCoveragePercentage ?? 0);
        insurancePays = (totalAmount * coverage) / 100;
      }
    }
    const patientPays = totalAmount - insurancePays;

    // 2. Check delivery logic
    let deliveryFee = 0;
    if (data.deliveryOption === 'HOME_DELIVERY') {
      if (!pharmacy.offersDelivery) throw new BadRequestException('Pharmacy does not offer delivery');
      const dist = data.deliveryDistanceKm ?? 0;
      if (dist <= 2) deliveryFee = 500;
      else if (dist <= 5) deliveryFee = 1000;
      else deliveryFee = 1500;
    }

    const reservation = this.reservationRepo.create({
      patient: { id: patientId },
      pharmacyId: data.pharmacyId,
      prescriptionImageUrl: data.prescriptionImageUrl,
      notes: data.notes,
      totalAmount,
      patientPays,
      insurancePays,
      paymentMethod: data.paymentMethod ?? 'PAY_AT_PHARMACY',
      deliveryOption: data.deliveryOption ?? 'PICKUP',
      deliveryAddress: data.deliveryAddress,
      deliveryFee,
      deliveryStatus: data.deliveryOption === 'HOME_DELIVERY' ? 'PENDING' as any : undefined,
      status: ReservationStatus.PENDING,
    } as any);

    const saved: any = await this.reservationRepo.save(reservation);

    // Save items linked to reservation
    for (const item of reservationItems) {
      await this.itemRepo.save({ ...item, reservationId: saved.id });
    }

    return this.findOne(saved.id);
  }

  findAll(page = 1, limit = 20) {
    return this.reservationRepo.find({
      relations: ['patient', 'pharmacy', 'items', 'items.medicine'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findByPatient(patientId: string, page = 1, limit = 10) {
    return this.reservationRepo.find({
      where: { patientId },
      relations: ['pharmacy', 'items', 'items.medicine'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findByPharmacist(userId: string, page = 1, limit = 20) {
    const pharmacy = await this.pharmacyRepo.findOne({ where: { owner: { id: userId } } });
    if (!pharmacy) return [];
    return this.reservationRepo.find({
      where: { pharmacyId: pharmacy.id },
      relations: ['patient', 'items', 'items.medicine'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string) {
    const r = await this.reservationRepo.findOne({
      where: { id },
      relations: ['patient', 'pharmacy', 'items', 'items.medicine'],
    });
    if (!r) throw new NotFoundException(`Reservation #${id} not found`);
    return r;
  }

  async confirm(id: string, userId: string) {
    const r = await this.findOne(id);
    await this.verifyPharmacistOwnsReservation(r, userId);
    if (r.status !== ReservationStatus.PENDING) throw new BadRequestException('Reservation is not pending');

    // Decrement stock for each reserved item
    for (const item of r.items) {
      const invItem = await this.inventoryRepo.findOne({
        where: { pharmacyId: r.pharmacyId, medicineId: item.medicineId },
      });
      if (!invItem) throw new BadRequestException(`Inventory item not found for medicine ${item.medicineId}`);
      if (invItem.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for medicine "${item.medicine?.name ?? item.medicineId}"`);
      }
      await this.inventoryRepo.update(invItem.id, { stock: invItem.stock - item.quantity });
    }

    await this.reservationRepo.update(id, { status: ReservationStatus.CONFIRMED });
    return this.findOne(id);
  }

  async complete(id: string, userId: string) {
    const r = await this.findOne(id);
    await this.verifyPharmacistOwnsReservation(r, userId);
    if (r.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed reservations can be marked as complete');
    }
    await this.reservationRepo.update(id, {
      status: ReservationStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
    });
    return this.findOne(id);
  }

  async reject(id: string, reason: string, userId: string) {
    if (!reason) throw new BadRequestException('A rejection reason is required');
    const r = await this.findOne(id);
    await this.verifyPharmacistOwnsReservation(r, userId);
    await this.reservationRepo.update(id, {
      status: ReservationStatus.REJECTED,
      rejectionReason: reason,
    });
    return this.findOne(id);
  }

  async cancel(id: string, patientId: string) {
    const r = await this.findOne(id);
    if (r.patientId !== patientId) throw new ForbiddenException('Not your reservation');
    if (r.status !== ReservationStatus.PENDING) throw new BadRequestException('Can only cancel pending reservations');
    await this.reservationRepo.update(id, { status: ReservationStatus.CANCELLED });
    return this.findOne(id);
  }

  private async verifyPharmacistOwnsReservation(reservation: Reservation, userId: string) {
    const pharmacy = await this.pharmacyRepo.findOne({ where: { owner: { id: userId } } });
    if (!pharmacy || pharmacy.id !== reservation.pharmacyId) {
      throw new ForbiddenException('Not your pharmacy');
    }
  }

  async payOnline(id: string, patientId: string) {
    const r = await this.findOne(id);
    if (r.patientId !== patientId) throw new ForbiddenException('Not your reservation');
    if (r.paymentMethod !== 'PAY_ONLINE') throw new BadRequestException('Reservation is not set to online payment');
    
    // Mock payment success
    await this.reservationRepo.update(id, { paymentStatus: PaymentStatus.PAID });
    return this.findOne(id);
  }
}
