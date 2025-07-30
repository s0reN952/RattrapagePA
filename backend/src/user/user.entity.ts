import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Truck } from '../truck/truck.entity';
import { Order } from '../order/order.entity';
import { Sales } from '../sales/sales.entity';
import { Payment } from '../payment/payment.entity';

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

  @OneToMany(() => Truck, truck => truck.user)
  trucks: Truck[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Sales, sales => sales.user)
  sales: Sales[];

  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];
} 