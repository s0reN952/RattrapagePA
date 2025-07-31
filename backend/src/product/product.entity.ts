import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column('decimal', { precision: 10, scale: 2 })
  prix: number;

  @Column()
  categorie: 'nourriture' | 'boisson' | 'dessert';

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: 'disponible' })
  statut: 'disponible' | 'rupture' | 'indisponible';

  @ManyToOne(() => Warehouse, warehouse => warehouse.produits)
  warehouse: Warehouse;
}