import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'droit_entree' | 'commission' | 'achat_obligatoire';

  @Column('decimal', { precision: 10, scale: 2 })
  montant: number;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: 'en_attente' })
  statut: 'en_attente' | 'paye' | 'annule';

  @CreateDateColumn()
  date_creation: Date;

  @Column({ nullable: true })
  date_paiement: Date;

  // Champs pour Stripe
  @Column({ nullable: true })
  stripe_payment_intent_id: string;

  @Column('text', { nullable: true })
  stripe_client_secret: string;

  @Column({ nullable: true })
  stripe_status: string;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  user: User;
}