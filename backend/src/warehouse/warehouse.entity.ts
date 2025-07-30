import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from '../product/product.entity';

@Entity()
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string; // "Paris Nord", "Paris Sud", "Paris Est", "Paris Ouest"

  @Column()
  adresse: string;

  @Column('text')
  description: string;

  @Column({ default: 'actif' })
  statut: 'actif' | 'inactif' | 'maintenance';

  @OneToMany(() => Product, product => product.warehouse)
  produits: Product[];
} 