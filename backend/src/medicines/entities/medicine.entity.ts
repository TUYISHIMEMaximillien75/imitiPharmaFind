import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
}
