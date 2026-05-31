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

export enum PaymentMethod {
  PAY_AT_PHARMACY = 'PAY_AT_PHARMACY',
  PAY_ONLINE = 'PAY_ONLINE',
}

export enum DeliveryOption {
  PICKUP = 'PICKUP',
  HOME_DELIVERY = 'HOME_DELIVERY',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
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

  @Column({ nullable: true, type: 'varchar' })
  insuranceNumber: string | null;

  @Column({ nullable: true, type: 'text' })
  insurancePrescriptionUrl: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  patientPays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  insurancePays: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.PAY_AT_PHARMACY,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: DeliveryOption,
    default: DeliveryOption.PICKUP,
  })
  deliveryOption: DeliveryOption;

  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    nullable: true,
  })
  deliveryStatus: DeliveryStatus;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
