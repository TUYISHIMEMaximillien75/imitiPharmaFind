import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Pharmacy } from '../../pharmacies/entities/pharmacy.entity';

@Entity('insurances')
export class Insurance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  providerName: string; // e.g. RAMA, MMI, CBHI

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defaultCoveragePercentage: number; // e.g. 85.00

  @ManyToMany(() => Pharmacy, pharmacy => pharmacy.insurances)
  pharmacies: Pharmacy[];
}
