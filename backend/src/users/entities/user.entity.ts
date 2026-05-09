import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { Pharmacy } from '../../pharmacies/entities/pharmacy.entity';

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

  // If a user is a PHARMACIST, they will be linked to a Pharmacy
  @OneToOne(() => Pharmacy, (pharmacy) => pharmacy.owner, { nullable: true, cascade: true })
  pharmacy: Pharmacy;
}
