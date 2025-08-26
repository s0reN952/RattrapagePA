import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Warehouse } from '../warehouse/warehouse.entity';
import { FranchiseStock } from './franchise-stock.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column('decimal', { precision: 10, scale: 2 })
  prix: number;

  @Column()
  category: 'nourriture' | 'boisson' | 'dessert' | 'ingredient' | 'plat_prepare';

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: 'disponible' })
  statut: 'disponible' | 'rupture' | 'indisponible';

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 10 })
  seuilAlerte: number;

  @Column({ type: 'int', default: 50 })
  stockMax: number;

  @Column({ type: 'int', default: 0 })
  stockReserve: number; // Stock réservé pour les commandes en cours

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  poids: number; // Poids en kg

  @Column({ type: 'varchar', length: 50, nullable: true })
  unite: string; // kg, l, unité, etc.

  @Column({ type: 'date', nullable: true })
  datePeremption: Date;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'boolean', default: false })
  isBio: boolean;

  @Column({ type: 'boolean', default: false })
  isLocal: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fournisseur: string;

  @Column({ type: 'text', nullable: true })
  allergenes: string; // Liste des allergènes séparés par des virgules

  @Column({ type: 'varchar', length: 20, default: 'frigo' })
  conservation: 'frigo' | 'congelateur' | 'ambiant' | 'sec';

  @Column({ type: 'int', default: 0 })
  dureeConservation: number; // Durée en jours

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  prixAchat: number; // Prix d'achat pour calculer les marges

  @Column({ type: 'boolean', default: false })
  isPromotion: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  remise: number; // Remise en pourcentage

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Warehouse, warehouse => warehouse.produits)
  warehouse: Warehouse;

  @OneToMany(() => FranchiseStock, franchiseStock => franchiseStock.product)
  franchiseStocks: FranchiseStock[];
}