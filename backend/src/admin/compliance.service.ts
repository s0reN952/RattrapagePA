import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { ComplianceRecord } from './compliance-record.entity';
import { Sales } from '../sales/sales.entity';
import { FranchiseStock } from '../product/franchise-stock.entity';
import { User, UserRole } from '../user/user.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceRecord)
    private complianceRecordRepository: Repository<ComplianceRecord>,
    @InjectRepository(Sales)
    private salesRepository: Repository<Sales>,
    @InjectRepository(FranchiseStock)
    private franchiseStockRepository: Repository<FranchiseStock>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Contrôle automatique mensuel pour un franchisé
  async checkMonthlyCompliance(franchiseId: number, month: number, year: number): Promise<ComplianceRecord> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Récupérer le CA total du mois
    const sales = await this.salesRepository.find({
      where: {
        user: { id: franchiseId },
        date: Between(startDate, endDate)
      }
    });

    const chiffreAffairesTotal = sales.reduce((total, sale) => total + Number(sale.chiffre_affaires), 0);
    const achatsObligatoires = chiffreAffairesTotal * 0.8; // 80% du CA
    const achatsLibres = chiffreAffairesTotal * 0.2; // 20% du CA

    // Récupérer les achats réels dans les entrepôts Driv'n Cook
    const franchiseStock = await this.franchiseStockRepository.find({
      where: {
        user: { id: franchiseId },
        isActive: true
      },
      relations: ['product']
    });

    // Calculer la valeur totale du stock (quantité × prix unitaire)
    const achatsReels = franchiseStock.reduce((total, stock) => {
      const valeurStock = Number(stock.quantite) * Number(stock.product?.prix || 0);
      return total + valeurStock;
    }, 0);
    
    const pourcentageConformite = chiffreAffairesTotal > 0 ? (achatsReels / chiffreAffairesTotal) * 100 : 0;
    const estConforme = pourcentageConformite >= 80;

    // Vérifier si un enregistrement existe déjà
    const existingRecord = await this.complianceRecordRepository.findOne({
      where: {
        franchise: { id: franchiseId },
        periode: startDate,
        typePeriode: 'monthly'
      }
    });

    if (existingRecord) {
      // Mettre à jour l'enregistrement existant
      existingRecord.chiffreAffairesTotal = chiffreAffairesTotal;
      existingRecord.achatsObligatoires = achatsObligatoires;
      existingRecord.achatsLibres = achatsLibres;
      existingRecord.pourcentageConformite = pourcentageConformite;
      existingRecord.estConforme = estConforme;
      existingRecord.updatedAt = new Date();
      
      return await this.complianceRecordRepository.save(existingRecord);
    } else {
      // Créer un nouvel enregistrement
      const newRecord = this.complianceRecordRepository.create({
        franchise: { id: franchiseId },
        periode: startDate,
        chiffreAffairesTotal,
        achatsObligatoires,
        achatsLibres,
        pourcentageConformite,
        estConforme,
        typePeriode: 'monthly',
        notes: `Contrôle automatique mensuel - ${month}/${year}`
      });

      return await this.complianceRecordRepository.save(newRecord);
    }
  }

  // Contrôle automatique trimestriel pour un franchisé
  async checkQuarterlyCompliance(franchiseId: number, quarter: number, year: number): Promise<ComplianceRecord> {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);

    // Récupérer le CA total du trimestre
    const sales = await this.salesRepository.find({
      where: {
        user: { id: franchiseId },
        date: Between(startDate, endDate)
      }
    });

    const chiffreAffairesTotal = sales.reduce((total, sale) => total + Number(sale.chiffre_affaires), 0);
    const achatsObligatoires = chiffreAffairesTotal * 0.8; // 80% du CA
    const achatsLibres = chiffreAffairesTotal * 0.2; // 20% du CA

    // Récupérer les achats réels dans les entrepôts
    const franchiseStock = await this.franchiseStockRepository.find({
      where: {
        user: { id: franchiseId },
        isActive: true
      },
      relations: ['product']
    });

    // Calculer la valeur totale du stock (quantité × prix unitaire)
    const achatsReels = franchiseStock.reduce((total, stock) => {
      const valeurStock = Number(stock.quantite) * Number(stock.product?.prix || 0);
      return total + valeurStock;
    }, 0);
    
    const pourcentageConformite = chiffreAffairesTotal > 0 ? (achatsReels / chiffreAffairesTotal) * 100 : 0;
    const estConforme = pourcentageConformite >= 80;

    // Vérifier si un enregistrement existe déjà
    const existingRecord = await this.complianceRecordRepository.findOne({
      where: {
        franchise: { id: franchiseId },
        periode: startDate,
        typePeriode: 'quarterly'
      }
    });

    if (existingRecord) {
      existingRecord.chiffreAffairesTotal = chiffreAffairesTotal;
      existingRecord.achatsObligatoires = achatsObligatoires;
      existingRecord.achatsLibres = achatsLibres;
      existingRecord.pourcentageConformite = pourcentageConformite;
      existingRecord.estConforme = estConforme;
      existingRecord.updatedAt = new Date();
      
      return await this.complianceRecordRepository.save(existingRecord);
    } else {
      const newRecord = this.complianceRecordRepository.create({
        franchise: { id: franchiseId },
        periode: startDate,
        chiffreAffairesTotal,
        achatsObligatoires,
        achatsLibres,
        pourcentageConformite,
        estConforme,
        typePeriode: 'quarterly',
        notes: `Contrôle automatique trimestriel - Q${quarter}/${year}`
      });

      return await this.complianceRecordRepository.save(newRecord);
    }
  }

  // Vérification en temps réel lors d'une commande
  async validateOrderCompliance(franchiseId: number, orderAmount: number): Promise<{
    canProceed: boolean;
    message: string;
    complianceStatus: any;
    montantRequis?: number;
  }> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const compliance = await this.checkMonthlyCompliance(franchiseId, currentMonth, currentYear);
    
    // Vérifier si cette commande supplémentaire respecterait toujours le 80%
    const newTotalAchats = (compliance.chiffreAffairesTotal * 0.8) + orderAmount;
    const newPourcentage = (newTotalAchats / compliance.chiffreAffairesTotal) * 100;
    
    if (newPourcentage <= 100) {
      return {
        canProceed: true,
        message: 'Commande autorisée - Respecte la règle 80/20',
        complianceStatus: compliance
      };
    } else {
      // Calculer combien il doit acheter pour être conforme
      const montantRequis = this.calculateRequiredAmount(compliance);
      
      return {
        canProceed: false,
        message: `Commande refusée - Violerait la règle 80/20. Vous devez acheter au moins ${montantRequis.toLocaleString('fr-FR')}€ dans nos entrepôts pour être conforme.`,
        complianceStatus: compliance,
        montantRequis
      };
    }
  }

  // Calculer le montant requis pour être conforme
  private calculateRequiredAmount(compliance: ComplianceRecord): number {
    const achatsReels = compliance.achatsObligatoires - (compliance.achatsObligatoires - compliance.pourcentageConformite * compliance.chiffreAffairesTotal / 100);
    const montantRequis = compliance.achatsObligatoires - achatsReels;
    return Math.max(0, montantRequis);
  }

  // Récupérer tous les enregistrements de conformité
  async getAllComplianceRecords(filters?: {
    franchiseId?: number;
    period?: 'monthly' | 'quarterly';
    startDate?: Date;
    endDate?: Date;
    isCompliant?: boolean;
  }): Promise<ComplianceRecord[]> {
    let query = this.complianceRecordRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.franchise', 'franchise')
      .orderBy('record.periode', 'DESC');

    if (filters?.franchiseId) {
      query = query.andWhere('franchise.id = :franchiseId', { franchiseId: filters.franchiseId });
    }

    if (filters?.period) {
      query = query.andWhere('record.typePeriode = :period', { period: filters.period });
    }

    if (filters?.startDate) {
      query = query.andWhere('record.periode >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query = query.andWhere('record.periode <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.isCompliant !== undefined) {
      query = query.andWhere('record.estConforme = :isCompliant', { isCompliant: filters.isCompliant });
    }

    return await query.getMany();
  }

  // Générer un rapport de conformité
  async generateComplianceReport(filters?: {
    period?: 'monthly' | 'quarterly';
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const records = await this.getAllComplianceRecords(filters);
    
    const totalFranchises = records.length;
    const conformes = records.filter(r => r.estConforme).length;
    const nonConformes = totalFranchises - conformes;
    const tauxConformite = totalFranchises > 0 ? (conformes / totalFranchises) * 100 : 0;
    
    const totalCA = records.reduce((sum, r) => sum + Number(r.chiffreAffairesTotal), 0);
    const totalAchatsObligatoires = records.reduce((sum, r) => sum + Number(r.achatsObligatoires), 0);
    const totalAchatsLibres = records.reduce((sum, r) => sum + Number(r.achatsLibres), 0);
    
    return {
      summary: {
        totalFranchises,
        conformes,
        nonConformes,
        tauxConformite
      },
      financial: {
        totalCA,
        totalAchatsObligatoires,
        totalAchatsLibres,
        moyenneConformite: records.reduce((sum, r) => sum + Number(r.pourcentageConformite), 0) / totalFranchises
      },
      records: records
    };
  }

  // Récupérer la vue d'ensemble avec détails des ventes et achats
  async getComplianceOverview(period: 'monthly' | 'quarterly' = 'monthly'): Promise<any> {
    // Récupérer tous les franchisés actifs
    const franchises = await this.userRepository.find({
      where: { role: UserRole.FRANCHISE }
    });

    const overview = {
      summary: {
        totalFranchises: franchises.length,
        conformes: 0,
        nonConformes: 0,
        tauxConformite: 0
      },
      financial: {
        totalCA: 0,
        totalAchatsObligatoires: 0,
        totalAchatsLibres: 0,
        moyenneConformite: 0
      },
      franchises: [] as any[]
    };

    let totalConformes = 0;
    let totalCA = 0;
    let totalAchatsObligatoires = 0;
    let totalAchatsLibres = 0;
    let totalPourcentageConformite = 0;

    for (const franchise of franchises) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Récupérer les ventes du franchisé
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      const sales = await this.salesRepository.find({
        where: {
          user: { id: franchise.id },
          date: Between(startDate, endDate)
        }
      });

      const franchiseCA = sales.reduce((total, sale) => total + Number(sale.chiffre_affaires), 0);
      
      // Récupérer les achats du franchisé dans vos entrepôts
      const franchiseStock = await this.franchiseStockRepository.find({
        where: {
          user: { id: franchise.id },
          isActive: true
        },
        relations: ['product']
      });

      // Calculer la valeur totale du stock (quantité × prix unitaire)
      const franchiseAchats = franchiseStock.reduce((total, stock) => {
        const valeurStock = Number(stock.quantite) * Number(stock.product?.prix || 0);
        return total + valeurStock;
      }, 0);
      
      const pourcentageAchats = franchiseCA > 0 ? (franchiseAchats / franchiseCA) * 100 : 0;
      const estConforme = pourcentageAchats >= 80;

      if (estConforme) totalConformes++;
      
      totalCA += franchiseCA;
      totalAchatsObligatoires += franchiseCA * 0.8;
      totalAchatsLibres += franchiseCA * 0.2;
      totalPourcentageConformite += pourcentageAchats;

      // Récupérer l'enregistrement de conformité s'il existe
      const complianceRecord = await this.complianceRecordRepository.findOne({
        where: {
          franchise: { id: franchise.id },
          periode: startDate,
          typePeriode: period
        }
      });

      overview.franchises.push({
        franchise: {
          id: franchise.id,
          nom: franchise.nom,
          prenom: franchise.prenom,
          email: franchise.email
        },
        sales: sales.map(sale => ({
          periode: sale.periode,
          chiffre_affaires: Number(sale.chiffre_affaires),
          nombre_commandes: sale.nombre_commandes,
          date_creation: sale.date_creation
        })),
        stock: franchiseStock.map(stock => ({
          id: stock.id,
          produit: stock.product?.nom || 'Produit inconnu',
          quantite: stock.quantite,
          prixUnitaire: stock.product?.prix || 0,
          valeurTotale: Number(stock.quantite) * Number(stock.product?.prix || 0),
          emplacement: stock.emplacement,
          createdAt: stock.createdAt
        })),
        compliance: complianceRecord,
        totalCA: franchiseCA,
        totalAchats: franchiseAchats,
        pourcentageAchats: pourcentageAchats,
        estConforme: estConforme
      });
    }

    overview.summary.conformes = totalConformes;
    overview.summary.nonConformes = franchises.length - totalConformes;
    overview.summary.tauxConformite = franchises.length > 0 ? (totalConformes / franchises.length) * 100 : 0;
    
    overview.financial.totalCA = totalCA;
    overview.financial.totalAchatsObligatoires = totalAchatsObligatoires;
    overview.financial.totalAchatsLibres = totalAchatsLibres;
    overview.financial.moyenneConformite = franchises.length > 0 ? totalPourcentageConformite / franchises.length : 0;

    return overview;
  }

  // Contrôle automatique pour tous les franchisés
  async checkAllFranchisesCompliance(month: number, year: number): Promise<ComplianceRecord[]> {
    const franchises = await this.userRepository.find({
      where: { role: UserRole.FRANCHISE }
    });

    const results: ComplianceRecord[] = [];
    
    for (const franchise of franchises) {
      try {
        const record = await this.checkMonthlyCompliance(franchise.id, month, year);
        results.push(record);
      } catch (error) {
        console.error(`Erreur lors du contrôle de conformité pour le franchisé ${franchise.id}:`, error);
      }
    }

    return results;
  }

  // Méthodes privées pour les calculs
  private async getFranchiseSales(franchiseId: number, startDate: Date, endDate: Date): Promise<Sales[]> {
    return await this.salesRepository.find({
      where: {
        user: { id: franchiseId },
        date: Between(startDate, endDate)
      }
    });
  }

  private async getFranchiseStock(franchiseId: number): Promise<FranchiseStock[]> {
    return await this.franchiseStockRepository.find({
      where: {
        user: { id: franchiseId },
        isActive: true
      },
      relations: ['product']
    });
  }
}
