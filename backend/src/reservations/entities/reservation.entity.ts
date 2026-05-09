import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Pharmacy } from '../../pharmacies/entities/pharmacy.entity';
import { ReservationItem } from './reservation-item.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @Column()
  patientId: string;

  @ManyToOne(() => Pharmacy, { eager: true })
  @JoinColumn({ name: 'pharmacyId' })
  pharmacy: Pharmacy;

  @Column()
  pharmacyId: string;

  @OneToMany(() => ReservationItem, (item) => item.reservation, { cascade: true, eager: true })
  items: ReservationItem[];

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  prescriptionImageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
