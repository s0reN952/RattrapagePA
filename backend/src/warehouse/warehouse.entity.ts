import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../product/product.entity';

export enum WarehouseStatus {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  MAINTENANCE = 'maintenance'
}

@Entity()
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  adresse: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  specialite: string;

  @Column({ type: 'text', nullable: true })
  zone: string;

  @Column({ type: 'time', nullable: true })
  heureOuverture: string;

  @Column({ type: 'time', nullable: true })
  heureFermeture: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fraisLivraison: number;

  @Column({ type: 'int', nullable: true })
  delaiLivraisonHeures: number;

  @Column({
    type: 'enum',
    enum: WarehouseStatus,
    default: WarehouseStatus.ACTIF
  })
  statut: WarehouseStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Product, product => product.warehouse)
  produits: Product[];
} 