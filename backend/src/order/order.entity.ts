import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  montant: number;

  @Column({ default: 'en_attente' })
  statut: 'en_attente' | 'en_preparation' | 'en_livraison' | 'livree' | 'annulee';

  @Column({ nullable: true })
  adresse_livraison: string;

  @Column({ nullable: true })
  date_livraison: Date;

  @CreateDateColumn()
  date_creation: Date;

  @UpdateDateColumn()
  date_modification: Date;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  user: User;
} 