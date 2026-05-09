import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pharmacy } from '../../pharmacies/entities/pharmacy.entity';
import { Medicine } from '../../medicines/entities/medicine.entity';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 10 })
  lowStockThreshold: number;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @ManyToOne(() => Pharmacy, (pharmacy) => pharmacy.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pharmacyId' })
  pharmacy: Pharmacy;

  @Column()
  pharmacyId: string;

  @ManyToOne(() => Medicine, (medicine) => medicine.inventoryItems, { eager: true })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;

  @Column()
  medicineId: string;
}
