import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Truck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ default: 'en_service' })
  statut: 'en_service' | 'en_panne' | 'entretien';

  @ManyToOne(() => User, user => user.trucks, { onDelete: 'CASCADE' })
  user: User;
} 