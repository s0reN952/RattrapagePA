import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User, UserRole } from '../user/user.entity';
import { Truck } from '../truck/truck.entity';
import { Order } from '../order/order.entity';
import { Sales } from '../sales/sales.entity';
import { Payment } from '../payment/payment.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../product/product.entity';
import { FranchiseStock } from '../product/franchise-stock.entity';
import { ComplianceRecord } from './compliance-record.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Truck)
    private truckRepository: Repository<Truck>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Sales)
    private salesRepository: Repository<Sales>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ComplianceRecord)
    private complianceRepository: Repository<ComplianceRecord>,
    @InjectRepository(FranchiseStock)
    private franchiseStockRepository: Repository<FranchiseStock>,
  ) {}

  // 🚛 Gestion des camions
  async createTruck(truckData: Partial<Truck>): Promise<Truck> {
    const truck = this.truckRepository.create({
      ...truckData,
      isAssigned: false,
      assignedAt: null,
      user: null
    });
    return this.truckRepository.save(truck);
  }

  async assignTruckToFranchise(truckId: number, franchiseId: number): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    const franchise = await this.userRepository.findOne({ where: { id: franchiseId, role: UserRole.FRANCHISE } });

    if (!truck) throw new NotFoundException('Camion non trouvé');
    if (!franchise) throw new NotFoundException('Franchisé non trouvé');

    // Vérifier que le camion n'est pas déjà attribué
    if (truck.isAssigned) {
      throw new BadRequestException('Ce camion est déjà attribué à un franchisé');
    }

    // Vérifier que le franchisé a payé le droit d'entrée
    const entryPayment = await this.paymentRepository.findOne({
      where: { user: { id: franchiseId }, type: 'droit_entree', statut: 'paye' }
    });

    if (!entryPayment) {
      throw new BadRequestException('Le franchisé doit d\'abord payer le droit d\'entrée de 50 000€');
    }

    // Vérifier que le franchisé n'a pas déjà un camion
    const existingTruck = await this.truckRepository.findOne({
      where: { user: { id: franchiseId }, isAssigned: true }
    });

    if (existingTruck) {
      throw new BadRequestException('Ce franchisé a déjà un camion attribué');
    }

    // Attribuer le camion
    truck.user = franchise;
    truck.isAssigned = true;
    truck.assignedAt = new Date();

    return this.truckRepository.save(truck);
  }

  async unassignTruck(truckId: number): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Camion non trouvé');

    if (!truck.isAssigned) {
      throw new BadRequestException('Ce camion n\'est pas attribué');
    }

    truck.user = null;
    truck.isAssigned = false;
    truck.assignedAt = null;

    return this.truckRepository.save(truck);
  }

  async getTruckFleet(): Promise<Truck[]> {
    return this.truckRepository.find({
      relations: ['user'],
      order: { id: 'ASC' }
    });
  }

  async getAvailableTrucks(): Promise<Truck[]> {
    return this.truckRepository.find({
      where: { isAssigned: false },
      order: { nom: 'ASC' }
    });
  }

  async getFranchisesEligibleForTruck(): Promise<User[]> {
    // Récupérer les franchisés qui ont payé le droit d'entrée et qui n'ont pas de camion
    const franchises = await this.userRepository.find({
      where: { role: UserRole.FRANCHISE },
      relations: ['payments', 'trucks']
    });

    return franchises.filter(franchise => {
      // Vérifier le paiement du droit d'entrée
      const hasPaidEntryFee = franchise.payments.some(p => 
        p.type === 'droit_entree' && p.statut === 'paye'
      );

      // Vérifier qu'il n'a pas déjà un camion
      const hasNoTruck = !franchise.trucks.some(t => t.isAssigned);

      return hasPaidEntryFee && hasNoTruck;
    });
  }

  // 🚛 Gestion avancée des camions
  async updateTruckMaintenance(truckId: number, maintenanceData: {
    statut?: string;
    maintenanceNotes?: string;
    nextMaintenance?: Date;
    kilometrage?: number;
    niveauCarburant?: string;
  }): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Camion non trouvé');

    // Si c'est une maintenance, mettre à jour la date de dernière maintenance
    if (maintenanceData.statut === 'entretien') {
      truck.lastMaintenance = new Date();
    }

    // Si c'est une panne, enregistrer la date
    if (maintenanceData.statut === 'en_panne') {
      truck.panneDate = new Date();
      truck.isOperational = false;
    }

    // Si c'est de retour en service, résoudre la panne
    if (maintenanceData.statut === 'en_service' && truck.statut === 'en_panne') {
      truck.panneResolvedAt = new Date();
      truck.isOperational = true;
    }

    Object.assign(truck, maintenanceData);
    return this.truckRepository.save(truck);
  }

  async reportTruckBreakdown(truckId: number, breakdownData: {
    panneDescription: string;
    emplacement?: string;
    zone?: string;
  }): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Camion non trouvé');

    truck.statut = 'en_panne';
    truck.panneDescription = breakdownData.panneDescription;
    truck.panneDate = new Date();
    truck.isOperational = false;
    
    if (breakdownData.emplacement) {
      truck.emplacement = breakdownData.emplacement;
    }
    if (breakdownData.zone) {
      truck.zone = breakdownData.zone;
    }

    return this.truckRepository.save(truck);
  }

  async resolveTruckBreakdown(truckId: number, resolutionData: {
    panneResolution: string;
    maintenanceNotes?: string;
  }): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Camion non trouvé');

    truck.statut = 'en_service';
    truck.panneResolution = resolutionData.panneResolution;
    truck.panneResolvedAt = new Date();
    truck.isOperational = true;
    
    if (resolutionData.maintenanceNotes) {
      truck.maintenanceNotes = resolutionData.maintenanceNotes;
    }

    return this.truckRepository.save(truck);
  }

  async updateTruckLocation(truckId: number, locationData: {
    emplacement: string;
    zone: string;
  }): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Camion non trouvé');

    truck.emplacement = locationData.emplacement;
    truck.zone = locationData.zone;

    return this.truckRepository.save(truck);
  }

  async scheduleMaintenance(truckId: number, maintenanceData: {
    nextMaintenance: Date;
    maintenanceNotes?: string;
  }): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) throw new NotFoundException('Camion non trouvé');

    truck.nextMaintenance = maintenanceData.nextMaintenance;
    if (maintenanceData.maintenanceNotes) {
      truck.maintenanceNotes = maintenanceData.maintenanceNotes;
    }

    return this.truckRepository.save(truck);
  }

  async getTruckMaintenanceHistory(truckId: number): Promise<any> {
    const truck = await this.truckRepository.findOne({ 
      where: { id: truckId },
      relations: ['user']
    });
    
    if (!truck) throw new NotFoundException('Camion non trouvé');

    return {
      id: truck.id,
      nom: truck.nom,
      statut: truck.statut,
      lastMaintenance: truck.lastMaintenance,
      nextMaintenance: truck.nextMaintenance,
      maintenanceNotes: truck.maintenanceNotes,
      panneDescription: truck.panneDescription,
      panneDate: truck.panneDate,
      panneResolution: truck.panneResolution,
      panneResolvedAt: truck.panneResolvedAt,
      emplacement: truck.emplacement,
      zone: truck.zone,
      kilometrage: truck.kilometrage,
      niveauCarburant: truck.niveauCarburant,
      isOperational: truck.isOperational,
      assignedTo: truck.user ? `${truck.user.prenom} ${truck.user.nom}` : 'Aucun franchisé'
    };
  }

  async getMaintenanceSchedule(): Promise<Truck[]> {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.truckRepository.find({
      where: {
        nextMaintenance: Between(today, nextWeek)
      },
      relations: ['user'],
      order: { nextMaintenance: 'ASC' }
    });
  }

  async getTrucksByZone(zone: string): Promise<Truck[]> {
    return this.truckRepository.find({
      where: { zone },
      relations: ['user'],
      order: { nom: 'ASC' }
    });
  }

  async getOperationalTrucks(): Promise<Truck[]> {
    return this.truckRepository.find({
      where: { isOperational: true },
      relations: ['user'],
      order: { nom: 'ASC' }
    });
  }

  // 👥 Gestion avancée des franchisés
  async getAllFranchises(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.FRANCHISE },
      relations: ['trucks', 'payments', 'sales', 'orders'],
      order: { nom: 'ASC' }
    });
  }

  async getAllFranchisesWithMetrics(): Promise<any[]> {
    const franchises = await this.userRepository.find({
      where: { role: UserRole.FRANCHISE },
      relations: ['trucks', 'payments', 'sales', 'orders']
    });

    const franchisesWithMetrics: any[] = [];
    for (const franchise of franchises) {
      const metrics = await this.calculateFranchiseMetrics(franchise);
      franchisesWithMetrics.push(metrics);
    }

    return franchisesWithMetrics;
  }

  async getFranchiseById(franchiseId: number): Promise<any> {
    const franchise = await this.userRepository.findOne({
      where: { id: franchiseId, role: UserRole.FRANCHISE },
      relations: ['trucks', 'payments', 'sales', 'orders']
    });

    if (!franchise) throw new NotFoundException('Franchisé non trouvé');

    return this.calculateFranchiseMetrics(franchise);
  }

  async validateFranchise(franchiseId: number, validationData: {
    isActive: boolean;
    notes?: string;
    reason?: string;
  }): Promise<User> {
    const franchise = await this.userRepository.findOne({ 
      where: { id: franchiseId, role: UserRole.FRANCHISE } 
    });
    
    if (!franchise) throw new NotFoundException('Franchisé non trouvé');

    franchise.isActive = validationData.isActive;
    franchise.notes = validationData.notes || franchise.notes;
    
    return this.userRepository.save(franchise);
  }

  async updateFranchiseStatus(franchiseId: number, statusData: {
    isActive: boolean;
    status: 'actif' | 'suspendu' | 'en_attente' | 'termine';
    reason?: string;
    notes?: string;
  }): Promise<User> {
    const franchise = await this.userRepository.findOne({ 
      where: { id: franchiseId, role: UserRole.FRANCHISE } 
    });
    
    if (!franchise) throw new NotFoundException('Franchisé non trouvé');

    franchise.isActive = statusData.isActive;
    franchise.notes = statusData.notes || franchise.notes;
    
    // Ajouter le statut dans les notes
    const statusNote = `[${new Date().toLocaleDateString('fr-FR')}] Statut: ${statusData.status}${statusData.reason ? ` - Raison: ${statusData.reason}` : ''}`;
    franchise.notes = franchise.notes ? `${franchise.notes}\n${statusNote}` : statusNote;

    return this.userRepository.save(franchise);
  }

  async getFranchisePerformance(franchiseId: number, period: 'week' | 'month' | 'quarter' | 'year'): Promise<any> {
    const franchise = await this.userRepository.findOne({
      where: { id: franchiseId, role: UserRole.FRANCHISE },
      relations: ['sales', 'orders', 'payments']
    });

    if (!franchise) throw new NotFoundException('Franchisé non trouvé');

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodSales = franchise.sales.filter(sale => 
      new Date(sale.date) >= startDate
    );

    const totalSales = periodSales.reduce((sum, sale) => sum + sale.montant, 0);
    const commission = totalSales * 0.04; // 4% du CA
    const mandatoryPurchases = totalSales * 0.8; // 80% des achats

    return {
      period,
      startDate,
      endDate: now,
      totalSales,
      commission,
      mandatoryPurchases,
      salesCount: periodSales.length,
      averageOrderValue: periodSales.length > 0 ? totalSales / periodSales.length : 0,
      compliance: {
        entryFee: franchise.payments.some(p => p.type === 'droit_entree' && p.statut === 'paye'),
        commissionPaid: franchise.payments.some(p => p.type === 'commission' && p.statut === 'paye'),
        mandatoryPurchases: franchise.payments.some(p => p.type === 'achat_obligatoire' && p.statut === 'paye')
      }
    };
  }

  async getFranchiseSupport(franchiseId: number): Promise<any> {
    const franchise = await this.userRepository.findOne({
      where: { id: franchiseId, role: UserRole.FRANCHISE },
      relations: ['trucks', 'payments', 'sales']
    });

    if (!franchise) throw new NotFoundException('Franchisé non trouvé');

    const metrics = await this.calculateFranchiseMetrics(franchise);
    
    return {
      ...metrics,
      support: {
        hasActiveTruck: franchise.trucks.some(t => t.isAssigned && t.isOperational),
        truckIssues: franchise.trucks.filter(t => t.statut === 'en_panne').length,
        paymentIssues: franchise.payments.filter(p => p.statut === 'en_attente').length,
        lastActivity: franchise.lastLogin,
        status: franchise.isActive ? 'Actif' : 'Inactif'
      }
    };
  }

  async addFranchiseNote(franchiseId: number, noteData: {
    note: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }): Promise<User> {
    const franchise = await this.userRepository.findOne({ 
      where: { id: franchiseId, role: UserRole.FRANCHISE } 
    });
    
    if (!franchise) throw new NotFoundException('Franchisé non trouvé');

    const timestamp = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
    const formattedNote = `[${timestamp}] [${noteData.type.toUpperCase()}] ${noteData.note}`;
    
    franchise.notes = franchise.notes ? `${franchise.notes}\n${formattedNote}` : formattedNote;

    return this.userRepository.save(franchise);
  }

  async getFranchiseCompliance(): Promise<any[]> {
    const franchises = await this.userRepository.find({
      where: { role: UserRole.FRANCHISE },
      relations: ['payments', 'sales', 'trucks']
    });

    const franchisesWithMetrics: any[] = [];
    for (const franchise of franchises) {
      const metrics = await this.calculateFranchiseMetrics(franchise);
      franchisesWithMetrics.push(metrics);
    }

    return franchisesWithMetrics;
  }

  // Méthode helper pour calculer les métriques d'un franchisé
  private async calculateFranchiseMetrics(franchise: User): Promise<any> {
    // Récupérer les ventes du mois en cours
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const monthlySales = franchise.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
    
    const totalSales = monthlySales.reduce((sum, sale) => sum + Number(sale.chiffre_affaires), 0);
    const commission = totalSales * 0.04;
    
    // Récupérer le stock actuel pour calculer la conformité 80/20
    const franchiseStock = await this.franchiseStockRepository.find({
      where: {
        user: { id: franchise.id },
        isActive: true
      },
      relations: ['product']
    });
    
    // Calculer la valeur totale du stock (conformité 80/20)
    const totalStockValue = franchiseStock.reduce((total, stock) => {
      const valeurStock = Number(stock.quantite) * Number(stock.product?.prix || 0);
      return total + valeurStock;
    }, 0);
    
    // Calculer la conformité 80/20 : 80% du CA doit être acheté chez Driv'n Cook
    const pourcentageConformite = totalSales > 0 ? (totalStockValue / totalSales) * 100 : 0;
    const estConforme80_20 = pourcentageConformite >= 80;

    // Filtrer et nettoyer les paiements
    const validPayments = franchise.payments || [];
    
    // Debug: Afficher les paiements pour diagnostiquer
    console.log(`🔍 Paiements pour ${franchise.prenom} ${franchise.nom}:`, validPayments);
    
    // Fonction helper pour vérifier la conformité d'un type de paiement
    const checkPaymentCompliance = (type: string): boolean => {
      const paymentsOfType = validPayments.filter(p => p.type === type);
      console.log(`💰 Paiements de type ${type}:`, paymentsOfType);
      if (paymentsOfType.length === 0) return false;
      
      // Prendre le paiement le plus récent de ce type
      const latestPayment = paymentsOfType.reduce((latest, current) => 
        current.date_creation > latest.date_creation ? current : latest
      );
      
      const isCompliant = latestPayment.statut === 'paye';
      console.log(`✅ Conformité ${type}: ${isCompliant} (statut: ${latestPayment.statut})`);
      return isCompliant;
    };

    return {
      id: franchise.id,
      nom: franchise.nom,
      prenom: franchise.prenom,
      email: franchise.email,
      isActive: franchise.isActive,
      lastLogin: franchise.lastLogin,
      notes: franchise.notes,
      totalSales,
      commission,
      mandatoryPurchases: totalSales * 0.8,
      trucksCount: franchise.trucks.filter(t => t.isAssigned).length,
      compliance: {
        entryFee: checkPaymentCompliance('droit_entree'),
        commissionPaid: checkPaymentCompliance('commission'),
        mandatoryPurchases: estConforme80_20, // ✅ Conformité 80/20 basée sur le calcul
        compliance80_20: estConforme80_20,
        pourcentageConformite: pourcentageConformite.toFixed(1),
        totalStockValue
      },
      status: this.getFranchiseStatus(franchise)
    };
  }

  // Méthode helper pour déterminer le statut d'un franchisé
  private getFranchiseStatus(franchise: User): string {
    if (!franchise.isActive) return 'Inactif';
    
    // Filtrer et nettoyer les paiements
    const validPayments = franchise.payments || [];
    
    // Vérifier le droit d'entrée (prendre le plus récent)
    const entryFeePayments = validPayments.filter(p => p.type === 'droit_entree');
    const hasEntryFee = entryFeePayments.length > 0 && 
      entryFeePayments.reduce((latest, current) => 
        current.date_creation > latest.date_creation ? current : latest
      ).statut === 'paye';
    
    const hasTruck = franchise.trucks.some(t => t.isAssigned);
    
    if (!hasEntryFee) return 'En attente de paiement';
    if (!hasTruck) return 'En attente de camion';
    
    return 'Opérationnel';
  }

  // 📈 Rapports et statistiques
  async generateSalesReport(startDate: Date, endDate: Date): Promise<any> {
    const sales = await this.salesRepository.find({
      where: {
        date: Between(startDate, endDate)
      },
      relations: ['user']
    });

    const report = {
      period: { startDate, endDate },
      totalSales: sales.reduce((sum, sale) => sum + sale.montant, 0),
      totalOrders: sales.length,
      salesByFranchise: {},
      dailySales: {},
      topProducts: {}
    };

    // Grouper par franchisé
    sales.forEach(sale => {
      const franchiseName = `${sale.user.nom} ${sale.user.prenom}`;
      if (!report.salesByFranchise[franchiseName]) {
        report.salesByFranchise[franchiseName] = 0;
      }
      report.salesByFranchise[franchiseName] += sale.montant;
    });

    return report;
  }

  // 📊 Génération automatique de rapports PDF (Version simplifiée)
  async generateAutomaticReport(reportType: 'monthly' | 'quarterly'): Promise<any> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    if (reportType === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      periodLabel = `Q${quarter + 1}-${now.getFullYear()}`;
    }

    try {
      // Récupérer les données de base sans relations complexes
      const [salesCount, franchisesCount, trucksCount, paymentsCount] = await Promise.all([
        this.salesRepository.count({
          where: { date: Between(startDate, endDate) }
        }),
        this.userRepository.count({
          where: { role: UserRole.FRANCHISE, isActive: true }
        }),
        this.truckRepository.count(),
        this.paymentRepository.count({
          where: { 
            date_creation: Between(startDate, endDate),
            statut: 'paye'
          }
        })
      ]);

      // Données factices pour le test (à remplacer plus tard par de vraies données)
      const reportData = {
        period: { startDate, endDate, label: periodLabel },
        financial: {
          totalCA: 250000, // CA factice pour le test
          totalCommissions: 10000, // 4% du CA factice
          totalEntryFees: 1500000, // Droits d'entrée factices
          totalRevenue: 1510000
        },
        franchises: {
          total: franchisesCount,
          new: Math.floor(franchisesCount * 0.1), // 10% de nouveaux
          active: franchisesCount,
          performance: []
        },
        trucks: {
          total: trucksCount,
          assigned: Math.floor(trucksCount * 0.8), // 80% attribués
          available: Math.floor(trucksCount * 0.2), // 20% disponibles
          maintenance: Math.floor(trucksCount * 0.1), // 10% en maintenance
          breakdown: Math.floor(trucksCount * 0.05) // 5% en panne
        },
        warehouses: {
          total: 4, // 4 entrepôts en Île-de-France
          inventory: {
            totalProducts: 1250,
            lowStockProducts: 45
          }
        },
        sales: {
          total: salesCount,
          daily: {},
          byFranchise: {},
          topProducts: {
            'Burger Classic': 15000,
            'Frites Maison': 12000,
            'Salade César': 8000,
            'Smoothie Fruits': 6000,
            'Tiramisu': 4000
          }
        }
      };

      // Générer le PDF
      const pdfContent = this.generateAdminPDF(reportData);
      
      // Sauvegarder le rapport
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `rapport-admin-${reportType}-${periodLabel}-${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      
      fs.writeFileSync(filepath, pdfContent);

      return {
        filename,
        filepath,
        data: reportData,
        message: `Rapport ${reportType} généré avec succès`
      };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw new Error(`Erreur lors de la génération du rapport: ${error.message}`);
    }
  }

  // 🚀 Génération automatique des rapports
  async generateAutomaticReportsIfNeeded(): Promise<void> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.ceil(currentMonth / 3);

      // Vérifier si un rapport mensuel existe pour ce mois
      const monthlyReportExists = await this.checkMonthlyReportExists(currentMonth, currentYear);
      if (!monthlyReportExists) {
        console.log(`📅 Génération automatique du rapport mensuel ${currentMonth}/${currentYear}`);
        await this.generateAutomaticReport('monthly');
      }

      // Vérifier si un rapport trimestriel existe pour ce trimestre
      const quarterlyReportExists = await this.checkQuarterlyReportExists(currentQuarter, currentYear);
      if (!quarterlyReportExists) {
        console.log(`📊 Génération automatique du rapport trimestriel Q${currentQuarter}-${currentYear}`);
        await this.generateAutomaticReport('quarterly');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération automatique:', error);
    }
  }

  // 🔍 Vérifier si un rapport mensuel existe
  private async checkMonthlyReportExists(month: number, year: number): Promise<boolean> {
    try {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'reports');
      
      if (!fs.existsSync(reportsDir)) {
        return false;
      }

      const files = fs.readdirSync(reportsDir);
      const monthlyPattern = new RegExp(`rapport-admin-monthly-${year}-${month.toString().padStart(2, '0')}-`);
      
      return files.some(file => monthlyPattern.test(file));
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du rapport mensuel:', error);
      return false;
    }
  }

  // 🔍 Vérifier si un rapport trimestriel existe
  private async checkQuarterlyReportExists(quarter: number, year: number): Promise<boolean> {
    try {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'reports');
      
      if (!fs.existsSync(reportsDir)) {
        return false;
      }

      const files = fs.readdirSync(reportsDir);
      const quarterlyPattern = new RegExp(`rapport-admin-quarterly-Q${quarter}-${year}-`);
      
      return files.some(file => quarterlyPattern.test(file));
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du rapport trimestriel:', error);
      return false;
    }
  }

  // 📊 Données de performance des franchisés
  private async getFranchisePerformanceData(franchises: User[], sales: Sales[]): Promise<any[]> {
    return franchises.map(franchise => {
      const franchiseSales = sales.filter(s => s.user && s.user.id === franchise.id);
      const totalCA = franchiseSales.reduce((sum, s) => sum + (s.montant || 0), 0);
      const totalOrders = franchiseSales.length;
      const averageOrder = totalOrders > 0 ? totalCA / totalOrders : 0;

      return {
        id: franchise.id,
        name: `${franchise.prenom || ''} ${franchise.nom || ''}`.trim() || 'Franchisé inconnu',
        email: franchise.email || '',
        totalCA,
        totalOrders,
        averageOrder,
        commission: totalCA * 0.04,
        lastActivity: franchise.lastLogin
      };
    }).sort((a, b) => b.totalCA - a.totalCA);
  }

  // 🏢 Résumé des entrepôts
  private async getWarehouseInventorySummary(warehouses: Warehouse[]): Promise<any> {
    const totalProducts = warehouses.reduce((sum, w) => sum + (w.produits?.length || 0), 0);
    const lowStockProducts = warehouses.reduce((sum, w) => 
      sum + (w.produits?.filter(p => p.stock < (p.seuilAlerte || 10)).length || 0), 0);

    return {
      totalProducts,
      lowStockProducts,
      warehouses: warehouses.map(w => ({
        id: w.id,
        name: w.nom,
        products: w.produits?.length || 0,
        lowStock: w.produits?.filter(p => p.stock < (p.seuilAlerte || 10)).length || 0
      }))
    };
  }

  // 📈 Grouper les ventes par jour
  private groupSalesByDay(sales: Sales[]): Record<string, number> {
    const dailySales: Record<string, number> = {};
    
    sales.forEach(sale => {
      if (sale.date) {
        const date = new Date(sale.date).toISOString().split('T')[0];
        dailySales[date] = (dailySales[date] || 0) + (sale.montant || 0);
      }
    });

    return dailySales;
  }

  // 📈 Grouper les ventes par franchisé
  private groupSalesByFranchise(sales: Sales[]): Record<string, number> {
    const franchiseSales: Record<string, number> = {};
    
    sales.forEach(sale => {
      // Vérifier que sale.user existe et a les propriétés nécessaires
      if (sale.user && sale.user.nom && sale.user.prenom) {
        const franchiseName = `${sale.user.nom} ${sale.user.prenom}`;
        franchiseSales[franchiseName] = (franchiseSales[franchiseName] || 0) + (sale.montant || 0);
      } else {
        // Si pas d'utilisateur, mettre dans "Franchisé inconnu"
        const unknownFranchise = 'Franchisé inconnu';
        franchiseSales[unknownFranchise] = (franchiseSales[unknownFranchise] || 0) + (sale.montant || 0);
      }
    });

    return franchiseSales;
  }

  // 🍽️ Produits les plus vendus
  private async getTopProducts(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    // Cette méthode devra être implémentée selon votre logique de produits
    // Pour l'instant, retourner des données factices
    return {
      'Burger Classic': 15000,
      'Frites Maison': 12000,
      'Salade César': 8000,
      'Smoothie Fruits': 6000,
      'Tiramisu': 4000
    };
  }

  // 📄 Génération du PDF admin
  private generateAdminPDF(reportData: any): string {
    const currentDate = new Date().toDateString();
    
    // PDF ultra-simple sans aucun formatage special (exactement comme le service sales)
    let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 1500
>>
stream
BT
/F1 16 Tf
72 750 Td
(Drivn Cook - Rapport Administratif) Tj
0 -30 Td
/F1 12 Tf
(Periode: ${reportData?.period?.label || 'N/A'}) Tj
0 -20 Td
(Date: ${currentDate}) Tj
0 -40 Td
/F1 14 Tf
(Resume Financier) Tj
0 -25 Td
/F1 10 Tf
(Chiffre d'affaires: ${reportData?.financial?.totalCA || 0} EUR) Tj
0 -15 Td
(Commissions (4%): ${reportData?.financial?.totalCommissions || 0} EUR) Tj
0 -15 Td
(Droits d'entree: ${reportData?.financial?.totalEntryFees || 0} EUR) Tj
0 -15 Td
(Revenus totaux: ${reportData?.financial?.totalRevenue || 0} EUR) Tj
0 -30 Td
/F1 14 Tf
(Franchises) Tj
0 -25 Td
/F1 10 Tf
(Total: ${reportData?.franchises?.total || 0}) Tj
0 -15 Td
(Nouveaux: ${reportData?.franchises?.new || 0}) Tj
0 -15 Td
(Actifs: ${reportData?.franchises?.active || 0}) Tj
0 -30 Td
/F1 14 Tf
(Camions) Tj
0 -25 Td
/F1 10 Tf
(Total: ${reportData?.trucks?.total || 0}) Tj
0 -15 Td
(Attribues: ${reportData?.trucks?.assigned || 0}) Tj
0 -15 Td
(Disponibles: ${reportData?.trucks?.available || 0}) Tj
0 -15 Td
(En maintenance: ${reportData?.trucks?.maintenance || 0}) Tj
0 -15 Td
(En panne: ${reportData?.trucks?.breakdown || 0}) Tj
0 -30 Td
/F1 14 Tf
(Entrepots) Tj
0 -25 Td
/F1 10 Tf
(Total produits: ${reportData?.warehouses?.inventory?.totalProducts || 0}) Tj
0 -15 Td
(En rupture: ${reportData?.warehouses?.inventory?.lowStockProducts || 0}) Tj
0 -30 Td
/F1 14 Tf
(Ventes) Tj
0 -25 Td
/F1 10 Tf
(Total commandes: ${reportData?.sales?.total || 0}) Tj
0 -15 Td
(Periode: ${reportData?.period?.startDate || 'N/A'} au ${reportData?.period?.endDate || 'N/A'}) Tj
0 -30 Td
/F1 14 Tf
(Produits les plus vendus) Tj
0 -25 Td
/F1 10 Tf
`;

    // Ajouter les produits les plus vendus de maniere simple
    if (reportData?.sales?.topProducts) {
      Object.entries(reportData.sales.topProducts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .forEach(([product, sales]) => {
          pdfContent += `(${product}: ${sales} EUR) Tj
0 -15 Td
`;
        });
    }

    pdfContent += `ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${pdfContent.length}
%%EOF
`;

    return pdfContent;
  }

  // 💰 Suivi financier
  async getFinancialOverview(): Promise<any> {
    const [totalSales, totalCommissions, totalEntryFees] = await Promise.all([
      this.salesRepository.createQueryBuilder('sales')
        .select('SUM(sales.montant)', 'total')
        .getRawOne(),
      this.paymentRepository.createQueryBuilder('payment')
        .select('SUM(payment.montant)', 'total')
        .where('payment.type = :type', { type: 'commission' })
        .andWhere('payment.statut = :statut', { statut: 'paye' })
        .getRawOne(),
      this.paymentRepository.createQueryBuilder('payment')
        .select('SUM(payment.montant)', 'total')
        .where('payment.type = :type', { type: 'droit_entree' })
        .andWhere('payment.statut = :statut', { statut: 'paye' })
        .getRawOne()
    ]);

    return {
      totalSales: parseFloat(totalSales?.total || '0') || 0,
      totalCommissions: parseFloat(totalCommissions?.total || '0') || 0,
      totalEntryFees: parseFloat(totalEntryFees?.total || '0') || 0,
      totalRevenue: (parseFloat(totalCommissions?.total || '0') || 0) + (parseFloat(totalEntryFees?.total || '0') || 0)
    };
  }

  // 📊 Contrôle de conformité 80/20
  async getComplianceOverview(): Promise<any> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const complianceRecords = await this.complianceRepository.find({
      where: {
        periode: new Date(currentYear, currentMonth - 1, 1),
        typePeriode: 'monthly'
      },
      relations: ['franchise']
    });

    const totalFranchises = complianceRecords.length;
    const conformes = complianceRecords.filter(r => r.estConforme).length;
    const nonConformes = totalFranchises - conformes;
    
    const totalCA = complianceRecords.reduce((sum, r) => sum + r.chiffreAffairesTotal, 0);
    const totalAchatsObligatoires = complianceRecords.reduce((sum, r) => sum + r.achatsObligatoires, 0);
    const totalAchatsLibres = complianceRecords.reduce((sum, r) => sum + r.achatsLibres, 0);

    return {
      summary: {
        totalFranchises,
        conformes,
        nonConformes,
        tauxConformite: totalFranchises > 0 ? (conformes / totalFranchises) * 100 : 0
      },
      financial: {
        totalCA,
        totalAchatsObligatoires,
        totalAchatsLibres,
        moyenneConformite: complianceRecords.length > 0 ? 
          complianceRecords.reduce((sum, r) => sum + r.pourcentageConformite, 0) / complianceRecords.length : 0
      },
      details: complianceRecords
    };
  }

  // 🔍 Vérifier la conformité d'un franchisé
  async checkFranchiseCompliance(franchiseId: number): Promise<any> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const compliance = await this.complianceRepository.findOne({
      where: {
        franchise: { id: franchiseId },
        periode: new Date(currentYear, currentMonth - 1, 1),
        typePeriode: 'monthly'
      }
    });

    if (!compliance) {
      return {
        message: 'Aucun enregistrement de conformité trouvé pour ce mois',
        needsCheck: true
      };
    }

    return {
      ...compliance,
      message: compliance.estConforme ? 'Franchisé conforme' : 'Franchisé non conforme',
      needsAction: !compliance.estConforme
    };
  }

  // 🏢 Gestion des entrepôts
  async getWarehouseInventory(warehouseId: number): Promise<any> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
      relations: ['products']
    });

    if (!warehouse) throw new NotFoundException('Entrepôt non trouvé');

    return {
      ...warehouse,
      totalProducts: warehouse.produits.length,
      lowStockProducts: warehouse.produits.filter(p => p.stock < p.seuilAlerte)
    };
  }

  async updateProductStock(productId: number, quantity: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit non trouvé');

    product.stock = quantity;
    return this.productRepository.save(product);
  }

  // 🔐 Gestion des admins
  async createAdmin(adminData: any): Promise<User> {
    const admin = this.userRepository.create({
      ...adminData,
      role: UserRole.ADMIN,
      isActive: true
    });

    const savedAdmin = await this.userRepository.save(admin);
    if (Array.isArray(savedAdmin)) {
      return savedAdmin[0];
    }
    return savedAdmin;
  }

  async getAdminUsers(): Promise<Partial<User>[]> {
    const admins = await this.userRepository.find({
      where: { role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]) },
      order: { nom: 'ASC' }
    });
    
    return admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      nom: admin.nom,
      prenom: admin.prenom,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin
    }));
  }

  // 📊 Dashboard et statistiques
  async getDashboardStats(): Promise<any> {
    // Récupérer tous les franchisés avec leurs métriques
    const franchises = await this.getAllFranchisesWithMetrics();
    
    // Calculer les statistiques globales
    const totalFranchises = franchises.length;
    const operationalFranchises = franchises.filter(f => f.status === 'Opérationnel').length;
    const pendingPayment = franchises.filter(f => f.status === 'En attente de paiement').length;
    const pendingTruck = franchises.filter(f => f.status === 'En attente de camion').length;
    
    // Calculer le CA total et la croissance mensuelle
    const totalRevenue = franchises.reduce((sum, f) => sum + f.totalSales, 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculer la croissance par rapport au mois précédent (simulation)
    const monthlyGrowth = 12; // Pour l'exemple, à remplacer par un vrai calcul
    
    // Récupérer les statistiques des camions
    const trucks = await this.truckRepository.find();
    const totalTrucks = trucks.length;
    const availableTrucks = trucks.filter(t => !t.isAssigned).length;
    
    // Calculer le taux de conformité global
    const compliantFranchises = franchises.filter(f => f.compliance?.compliance80_20).length;
    const complianceRate = totalFranchises > 0 ? Math.round((compliantFranchises / totalFranchises) * 100) : 0;
    
    // Simuler le nombre de produits en rupture (à remplacer par un vrai calcul)
    const lowStockProducts = 5;
    
    return {
      totalFranchises,
      operationalFranchises,
      pendingPayment,
      pendingTruck,
      totalRevenue,
      monthlyGrowth,
      totalTrucks,
      availableTrucks,
      complianceRate,
      lowStockProducts
    };
  }
} 