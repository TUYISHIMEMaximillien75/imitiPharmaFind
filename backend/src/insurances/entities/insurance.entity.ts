import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PharmacyInsurance } from '../../pharmacies/entities/pharmacy-insurance.entity';

@Entity('insurances')
export class Insurance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  providerName: string; // e.g. RAMA, MMI, CBHI, Mutuelle de Santé

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defaultCoveragePercentage: number; // global default e.g. 85.00

  @OneToMany(() => PharmacyInsurance, (pi) => pi.insurance)
  pharmacyInsurances: PharmacyInsurance[];
}
