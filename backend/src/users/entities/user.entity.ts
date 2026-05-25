import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { Pharmacy } from '../../pharmacies/entities/pharmacy.entity';
import { Insurance } from '../../insurances/entities/insurance.entity';

export enum UserRole {
  PATIENT = 'PATIENT',
  PHARMACIST = 'PHARMACIST',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  insuranceNumber: string;

  @ManyToOne(() => Insurance, { nullable: true, eager: true })
  @JoinColumn({ name: 'insuranceProviderId' })
  insuranceProvider: Insurance;

  @Column({ nullable: true })
  insuranceProviderId: string;

  @Column({ default: false })
  isInsuranceVerified: boolean;

  // If a user is a PHARMACIST, they will be linked to a Pharmacy
  @OneToOne(() => Pharmacy, (pharmacy) => pharmacy.owner, { nullable: true, cascade: true })
  pharmacy: Pharmacy;
}
