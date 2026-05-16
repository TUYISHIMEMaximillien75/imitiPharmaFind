import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Pharmacy } from '../../pharmacies/entities/pharmacy.entity';
import { Insurance } from '../../insurances/entities/insurance.entity';

/**
 * Explicit join table for the Pharmacy ↔ Insurance ManyToMany.
 * Stores a pharmacy-specific coverage override so each pharmacy can
 * have a different coverage % for the same insurance provider.
 */
@Entity('pharmacy_insurance')
@Unique(['pharmacy', 'insurance'])
export class PharmacyInsurance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pharmacy, (p) => p.pharmacyInsurances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pharmacyId' })
  pharmacy: Pharmacy;

  @Column()
  pharmacyId: string;

  @ManyToOne(() => Insurance, (i) => i.pharmacyInsurances, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'insuranceId' })
  insurance: Insurance;

  @Column()
  insuranceId: string;

  /**
   * Optional override. If null, falls back to the global Insurance.defaultCoveragePercentage.
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  coveragePercentage: number | null;
}
