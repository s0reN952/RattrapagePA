import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from './product.entity';

@Entity()
export class FranchiseStock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.franchiseStocks)
  user: User;

  @ManyToOne(() => Product, product => product.franchiseStocks)
  product: Product;

  @Column({ type: 'int', default: 0 })
  quantite: number;

  @Column({ type: 'int', default: 10 })
  seuilAlerte: number;

  @Column({ type: 'int', default: 100 })
  stockMax: number;

  @Column({ type: 'date', nullable: true })
  datePeremption: Date;

  @Column({ type: 'varchar', length: 20, default: 'frigo' })
  emplacement: 'frigo' | 'congelateur' | 'ambiant' | 'sec';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  derniereCommande: Date;

  @Column({ type: 'int', default: 0 })
  quantiteCommande: number;

  @Column({ type: 'boolean', default: false })
  alerteReapprovisionnement: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
