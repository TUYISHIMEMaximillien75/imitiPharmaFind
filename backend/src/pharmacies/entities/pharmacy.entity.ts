import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

  @Column({ default: false })
  isActive: boolean; // Pending admin approval initially

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => User, (user) => user.pharmacy)
  @JoinColumn()
  owner: User;
}
