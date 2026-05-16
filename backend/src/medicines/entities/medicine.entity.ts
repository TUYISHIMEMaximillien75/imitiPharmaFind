import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

export enum MedicineCategory {
  ANTIBIOTIC = 'ANTIBIOTIC',
  PAINKILLER = 'PAINKILLER',
  VITAMIN = 'VITAMIN',
  ANTIFUNGAL = 'ANTIFUNGAL',
  ANTIVIRAL = 'ANTIVIRAL',
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  DIABETIC = 'DIABETIC',
  RESPIRATORY = 'RESPIRATORY',
  GASTROINTESTINAL = 'GASTROINTESTINAL',
  DERMATOLOGICAL = 'DERMATOLOGICAL',
  OTHER = 'OTHER',
}

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: MedicineCategory,
    default: MedicineCategory.OTHER,
  })
  category: MedicineCategory;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  imageUrl: string;

  @Column({ default: false })
  requiresPrescription: boolean;

  @OneToMany(() => InventoryItem, (item) => item.medicine)
  inventoryItems: InventoryItem[];
}
