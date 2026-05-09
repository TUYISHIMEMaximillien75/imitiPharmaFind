import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.embeddable';
import { Insurance } from '../../insurances/entities/insurance.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { OneToMany } from 'typeorm';

@Entity('pharmacies')
export class Pharmacy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column({ type: 'int', default: 8 })
  openingTime: number;

  @Column({ type: 'int', default: 20 })
  closingTime: number;

  @Column(() => Location)
  location: Location;

  @ManyToMany(() => Insurance, insurance => insurance.pharmacies)
  @JoinTable()
  insurances: Insurance[];

  @OneToMany(() => InventoryItem, inventoryItem => inventoryItem.pharmacy)
  inventory: InventoryItem[];

  @Column({ default: false })
  isActive: boolean; // Pending admin approval initially

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => User, (user) => user.pharmacy)
  @JoinColumn()
  owner: User;
}
