import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pharmacy, PharmacyStatus } from './entities/pharmacy.entity';
import { PharmacyInsurance } from './entities/pharmacy-insurance.entity';
import { Insurance } from '../insurances/entities/insurance.entity';

@Injectable()
export class PharmaciesService {
  constructor(
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepo: Repository<Pharmacy>,
    @InjectRepository(PharmacyInsurance)
    private readonly pharmacyInsuranceRepo: Repository<PharmacyInsurance>,
    @InjectRepository(Insurance)
    private readonly insuranceRepo: Repository<Insurance>,
  ) {}

  findAll() {
    return this.pharmacyRepo.find({
      relations: ['owner', 'pharmacyInsurances', 'pharmacyInsurances.insurance'],
      order: { createdAt: 'DESC' },
    });
  }

  findByOwner(userId: string) {
    return this.pharmacyRepo.find({
      where: { owner: { id: userId } },
      relations: ['pharmacyInsurances', 'pharmacyInsurances.insurance', 'inventory'],
    });
  }

  async findOne(id: string) {
    const pharmacy = await this.pharmacyRepo.findOne({
      where: { id },
      relations: ['owner', 'pharmacyInsurances', 'pharmacyInsurances.insurance', 'inventory', 'inventory.medicine'],
    });
    if (!pharmacy) throw new NotFoundException(`Pharmacy #${id} not found`);
    return pharmacy;
  }

  /** Lightweight public endpoint — no auth needed */
  async findOnePublic(id: string) {
    const pharmacy = await this.pharmacyRepo.findOne({
      where: { id },
      relations: ['pharmacyInsurances', 'pharmacyInsurances.insurance', 'inventory', 'inventory.medicine'],
    });
    if (!pharmacy) throw new NotFoundException(`Pharmacy #${id} not found`);
    return pharmacy;
  }

  async update(id: string, data: Partial<Pharmacy>) {
    await this.pharmacyRepo.update(id, data);
    return this.findOne(id);
  }

  async approve(id: string) {
    await this.pharmacyRepo.update(id, {
      status: PharmacyStatus.ACTIVE,
      isActive: true,
      rejectionReason: null,
    });
    return this.findOne(id);
  }

  async reject(id: string, reason: string) {
    await this.pharmacyRepo.update(id, {
      status: PharmacyStatus.REJECTED,
      isActive: false,
      rejectionReason: reason,
    });
    return this.findOne(id);
  }

  async suspend(id: string, reason?: string) {
    await this.pharmacyRepo.update(id, {
      status: PharmacyStatus.SUSPENDED,
      isActive: false,
      rejectionReason: reason ?? null,
    });
    return this.findOne(id);
  }

  async reactivate(id: string) {
    await this.pharmacyRepo.update(id, {
      status: PharmacyStatus.ACTIVE,
      isActive: true,
      rejectionReason: null,
    });
    return this.findOne(id);
  }

  /** Returns only status + rejectionReason for real-time polling */
  async getStatus(id: string) {
    const pharmacy = await this.pharmacyRepo.findOne({ where: { id }, select: ['id', 'status', 'rejectionReason'] });
    if (!pharmacy) throw new NotFoundException(`Pharmacy #${id} not found`);
    return { id: pharmacy.id, status: pharmacy.status, rejectionReason: pharmacy.rejectionReason };
  }

  /* ─── Per-pharmacy Insurance CRUD ─── */

  async getPharmacyInsurances(pharmacyId: string) {
    return this.pharmacyInsuranceRepo.find({
      where: { pharmacyId },
      relations: ['insurance'],
      order: { insurance: { providerName: 'ASC' } } as any,
    });
  }

  async addInsurance(pharmacyId: string, insuranceId: string, coveragePercentage?: number) {
    const ins = await this.insuranceRepo.findOne({ where: { id: insuranceId } });
    if (!ins) throw new NotFoundException(`Insurance #${insuranceId} not found`);

    // Upsert — avoid duplicate
    let pi = await this.pharmacyInsuranceRepo.findOne({ where: { pharmacyId, insuranceId } });
    if (!pi) {
      pi = this.pharmacyInsuranceRepo.create({ pharmacyId, insuranceId });
    }
    pi.coveragePercentage = coveragePercentage ?? null;
    return this.pharmacyInsuranceRepo.save(pi);
  }

  async updateInsuranceCoverage(pharmacyId: string, insuranceId: string, coveragePercentage: number) {
    const pi = await this.pharmacyInsuranceRepo.findOne({ where: { pharmacyId, insuranceId } });
    if (!pi) throw new NotFoundException('This insurance is not linked to your pharmacy');
    pi.coveragePercentage = coveragePercentage;
    return this.pharmacyInsuranceRepo.save(pi);
  }

  async removeInsurance(pharmacyId: string, insuranceId: string) {
    const pi = await this.pharmacyInsuranceRepo.findOne({ where: { pharmacyId, insuranceId } });
    if (!pi) throw new NotFoundException('Insurance not found on this pharmacy');
    return this.pharmacyInsuranceRepo.remove(pi);
  }
}
