import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class ComplianceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  franchise: User;

  @Column({ type: 'date' })
  periode: Date; // Mois/trimestre

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  chiffreAffairesTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  achatsObligatoires: number; // 80% du CA

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  achatsLibres: number; // 20% du CA

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  pourcentageConformite: number; // % réel des achats obligatoires

  @Column({ type: 'boolean' })
  estConforme: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 20, default: 'monthly' })
  typePeriode: 'monthly' | 'quarterly';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
