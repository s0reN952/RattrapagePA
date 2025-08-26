import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../product/product.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numeroCommande: string; // Format: "CMD-2024-001"

  @ManyToOne(() => User, user => user.orders)
  user: User;

  @Column({ type: 'int', nullable: true })
  warehouseId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montantTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fraisLivraison: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantHorsTaxe: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantTVA: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantTTC: number;

  @Column({ default: 'en_preparation' })
  statut: 'en_preparation' | 'en_cours' | 'livree' | 'annulee';

  @Column({ type: 'text', nullable: true })
  adresseLivraison: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime', nullable: true })
  dateLivraisonSouhaitee: Date;

  @Column({ type: 'datetime', nullable: true })
  dateLivraisonEffective: Date;

  @Column({ default: false })
  isLivraisonGratuite: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  pourcentageAchatObligatoire: number; // Pourcentage des achats Driv'n Cook

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items: OrderItem[];
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.items)
  order: Order;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prixUnitaire: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prixTotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  remise: number; // Remise en pourcentage

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
} 