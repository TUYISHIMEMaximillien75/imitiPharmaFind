import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.embeddable';
import { Insurance } from '../../insurances/entities/insurance.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

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

  @ManyToMany(() => Insurance, (insurance) => insurance.pharmacies)
  @JoinTable()
  insurances: Insurance[];

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
