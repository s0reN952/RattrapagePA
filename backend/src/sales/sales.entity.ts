import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Sales {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  periode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  chiffre_affaires: number;

  @Column('decimal', { precision: 10, scale: 2 })
  couts_operationnels: number;

  @Column('decimal', { precision: 10, scale: 2 })
  marge_brute: number;

  @Column('decimal', { precision: 5, scale: 2 })
  taux_marge: number;

  @Column('int')
  nombre_commandes: number;

  @Column('decimal', { precision: 10, scale: 2 })
  panier_moyen: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  montant: number;

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column('text', { nullable: true })
  commentaires: string;

  @CreateDateColumn()
  date_creation: Date;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  user: User;
} 