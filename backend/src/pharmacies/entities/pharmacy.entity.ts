import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToOne, JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.embeddable';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { PharmacyInsurance } from './pharmacy-insurance.entity';

export enum PharmacyStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('pharmacies')
export class Pharmacy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'int', default: 8 })
  openingTime: number;

  @Column({ type: 'int', default: 20 })
  closingTime: number;

  @Column(() => Location)
  location: Location;

  /** Explicit pivot so each pharmacy can override the coverage % per insurance */
  @OneToMany(() => PharmacyInsurance, (pi) => pi.pharmacy, { cascade: true })
  pharmacyInsurances: PharmacyInsurance[];

  @OneToMany(() => InventoryItem, (inventoryItem) => inventoryItem.pharmacy)
  inventory: InventoryItem[];

  @Column({
    type: 'enum',
    enum: PharmacyStatus,
    default: PharmacyStatus.PENDING,
  })
  status: PharmacyStatus;

  /** @deprecated use status instead */
  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => User, (user) => user.pharmacy)
  @JoinColumn()
  owner: User;
}
