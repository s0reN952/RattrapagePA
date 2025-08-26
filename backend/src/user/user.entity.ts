import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Truck } from '../truck/truck.entity';
import { Order } from '../order/order.entity';
import { Sales } from '../sales/sales.entity';
import { Payment } from '../payment/payment.entity';
import { FranchiseStock } from '../product/franchise-stock.entity';

export enum UserRole {
  FRANCHISE = 'franchise',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FRANCHISE
  })
  role: UserRole;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Truck, truck => truck.user)
  trucks: Truck[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Sales, sales => sales.user)
  sales: Sales[];

  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @OneToMany(() => FranchiseStock, franchiseStock => franchiseStock.user)
  franchiseStocks: FranchiseStock[];
} 