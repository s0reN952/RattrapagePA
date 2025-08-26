import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Truck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ default: 'en_service' })
  statut: 'en_service' | 'en_panne' | 'entretien' | 'hors_service';

  @Column({ default: false })
  isAssigned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastMaintenance: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextMaintenance: Date | null;

  @Column({ type: 'text', nullable: true })
  maintenanceNotes: string | null;

  @Column({ type: 'text', nullable: true })
  panneDescription: string | null;

  @Column({ type: 'timestamp', nullable: true })
  panneDate: Date | null;

  @Column({ type: 'text', nullable: true })
  panneResolution: string | null;

  @Column({ type: 'timestamp', nullable: true })
  panneResolvedAt: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emplacement: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  zone: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  kilometrage: number;

  @Column({ type: 'varchar', length: 20, default: 'A' })
  niveauCarburant: 'A' | 'B' | 'C' | 'D' | 'E';

  @Column({ type: 'boolean', default: true })
  isOperational: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.trucks, { onDelete: 'CASCADE', nullable: true })
  user: User | null;
} 