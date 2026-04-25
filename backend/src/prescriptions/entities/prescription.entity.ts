import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  rawOcrText: string;

  @Column({ type: 'jsonb', nullable: true })
  extractedMedicines: string[];

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'confirmed'

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
