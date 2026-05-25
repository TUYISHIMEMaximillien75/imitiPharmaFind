import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

export enum LocationType {
  PROVINCE = 'PROVINCE',
  DISTRICT = 'DISTRICT',
  SECTOR = 'SECTOR',
  CELL = 'CELL',
  VILLAGE = 'VILLAGE',
}

@Entity('location_nodes')
export class LocationNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: LocationType,
  })
  type: LocationType;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @ManyToOne(() => LocationNode, (node) => node.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: LocationNode;

  @OneToMany(() => LocationNode, (node) => node.parent)
  children: LocationNode[];
}
