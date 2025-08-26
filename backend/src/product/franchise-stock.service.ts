import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FranchiseStock } from './franchise-stock.entity';
import { Product } from './product.entity';
import { User } from '../user/user.entity';

@Injectable()
export class FranchiseStockService {
  constructor(
    @InjectRepository(FranchiseStock)
    private franchiseStockRepository: Repository<FranchiseStock>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  // Récupérer le stock d'un franchisé
  async getFranchiseStock(userId: number): Promise<FranchiseStock[]> {
    try {
      console.log(`🔍 Récupération du stock pour l'utilisateur ${userId}...`);
      
      // Récupérer depuis la table franchise_stock (comme avant)
      const franchiseStock = await this.franchiseStockRepository.find({
        where: { user: { id: userId }, isActive: true },
        relations: ['product', 'product.warehouse'],
        order: { product: { nom: 'ASC' } }
      });

      console.log(`🔍 Stock trouvé dans franchise_stock: ${franchiseStock.length} articles`);
      
      // Si pas de stock, essayer de récupérer depuis order_item pour déboguer
      if (franchiseStock.length === 0) {
        console.log(`🔍 Aucun stock trouvé, vérification des commandes...`);
        
        const orderItems = await this.dataSource.query(`
          SELECT 
            oi.id,
            oi.quantite,
            oi.prixUnitaire,
            oi.prixTotal,
            oi.notes,
            oi.createdAt as dateAchat,
            oi.productId,
            oi.orderId
          FROM order_item oi
          INNER JOIN \`order\` o ON oi.orderId = o.id
          WHERE o.userId = ?
          ORDER BY oi.createdAt DESC
        `, [userId]);
        
        console.log(`🔍 Commandes trouvées dans order_item: ${orderItems.length} articles`);
        console.log(`🔍 Détails des commandes:`, orderItems);
        
        // TEMPORAIRE : Créer des objets FranchiseStock à partir des commandes
        if (orderItems.length > 0) {
          console.log(`🔍 Création temporaire d'objets FranchiseStock depuis les commandes...`);
          
          const tempStock = orderItems.map((item: any) => {
            const stock = new FranchiseStock();
            stock.id = item.id;
            stock.quantite = item.quantite;
            stock.notes = item.notes;
            stock.createdAt = item.dateAchat;
            stock.updatedAt = item.dateAchat;
            stock.user = { id: userId } as any;
            stock.product = { id: item.productId } as any;
            stock.emplacement = 'frigo';
            stock.isActive = true;
            stock.seuilAlerte = 5;
            stock.stockMax = item.quantite * 2;
            stock.alerteReapprovisionnement = false;
            stock.derniereCommande = item.dateAchat;
            stock.quantiteCommande = 0;
            return stock;
          });
          
          console.log(`🔍 Objets temporaires créés: ${tempStock.length}`);
          return tempStock;
        }
      }

      return franchiseStock;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du stock pour l'utilisateur ${userId}:`, error);
      return [];
    }
  }

  // Ajouter un produit au stock d'un franchisé
  async addToStock(
    userId: number,
    productId: number,
    quantity: number,
    emplacement: string = 'frigo',
    notes?: string
  ): Promise<FranchiseStock> {
    console.log(`🔍 addToStock appelé pour userId: ${userId}, productId: ${productId}, quantity: ${quantity}`);
    
    const existingStock = await this.franchiseStockRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    if (existingStock) {
      console.log(`🔍 Stock existant trouvé, mise à jour de la quantité: ${existingStock.quantite} + ${quantity}`);
      existingStock.quantite += quantity;
      existingStock.alerteReapprovisionnement = existingStock.quantite <= existingStock.seuilAlerte;
      if (notes) existingStock.notes = notes;
      const updatedStock = await this.franchiseStockRepository.save(existingStock);
      console.log(`✅ Stock existant mis à jour: ${updatedStock.quantite} articles`);
      return updatedStock;
    }

    console.log(`🔍 Création d'un nouveau stock pour userId: ${userId}, productId: ${productId}`);
    
    const product = await this.productRepository.findOne({
      where: { id: productId }
    });

    if (!product) {
      console.error(`❌ Produit non trouvé: ${productId}`);
      throw new BadRequestException('Produit non trouvé');
    }

    console.log(`🔍 Produit trouvé: ${product.nom}`);

    const newStock = this.franchiseStockRepository.create({
      user: { id: userId },
      product: { id: productId },
      quantite: quantity,
      emplacement: emplacement as 'frigo' | 'congelateur' | 'ambiant' | 'sec',
      notes,
      seuilAlerte: Math.max(5, Math.floor(quantity * 0.2)), // 20% du stock initial
      stockMax: quantity * 2, // 2x le stock initial
      alerteReapprovisionnement: quantity <= 5
    });

    console.log(`🔍 Nouveau stock créé:`, newStock);
    
    const savedStock = await this.franchiseStockRepository.save(newStock);
    console.log(`✅ Nouveau stock sauvegardé avec ID: ${savedStock.id}`);
    
    return savedStock;
  }

  // Mettre à jour le stock d'un franchisé
  async updateStock(
    userId: number,
    productId: number,
    quantity: number,
    emplacement?: string,
    notes?: string
  ): Promise<FranchiseStock> {
    const stock = await this.franchiseStockRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    if (!stock) {
      throw new BadRequestException('Stock non trouvé');
    }

    stock.quantite = quantity;
    stock.alerteReapprovisionnement = quantity <= stock.seuilAlerte;
    if (emplacement) stock.emplacement = emplacement as 'frigo' | 'congelateur' | 'ambiant' | 'sec';
    if (notes) stock.notes = notes;

    return this.franchiseStockRepository.save(stock);
  }

  // Consommer du stock (pour les ventes)
  async consumeStock(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<FranchiseStock> {
    const stock = await this.franchiseStockRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    if (!stock) {
      throw new BadRequestException('Stock non trouvé');
    }

    if (stock.quantite < quantity) {
      throw new BadRequestException('Stock insuffisant');
    }

    stock.quantite -= quantity;
    stock.alerteReapprovisionnement = stock.quantite <= stock.seuilAlerte;

    return this.franchiseStockRepository.save(stock);
  }

  // Définir un seuil d'alerte personnalisé
  async setAlertThreshold(
    userId: number,
    productId: number,
    threshold: number
  ): Promise<FranchiseStock> {
    const stock = await this.franchiseStockRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    if (!stock) {
      throw new BadRequestException('Stock non trouvé');
    }

    stock.seuilAlerte = threshold;
    stock.alerteReapprovisionnement = stock.quantite <= threshold;

    return this.franchiseStockRepository.save(stock);
  }

  // Récupérer les alertes de réapprovisionnement
  async getReapprovisionnementAlerts(userId: number): Promise<FranchiseStock[]> {
    return this.franchiseStockRepository.find({
      where: { user: { id: userId }, alerteReapprovisionnement: true },
      relations: ['product', 'product.warehouse'],
      order: { product: { nom: 'ASC' } }
    });
  }

  // Calculer les statistiques de stock
  async getStockStats(userId: number): Promise<{
    totalProduits: number;
    totalValeur: number;
    produitsEnRupture: number;
    produitsEnAlerte: number;
    produitsPeremption: number;
    repartitionParEmplacement: Record<string, number>;
  }> {
    const stocks = await this.getFranchiseStock(userId);
    
    let totalValeur = 0;
    let produitsEnRupture = 0;
    let produitsEnAlerte = 0;
    let produitsPeremption = 0;
    const repartitionParEmplacement: Record<string, number> = {};

    stocks.forEach(stock => {
      const valeur = stock.quantite * parseFloat(stock.product.prix.toString());
      totalValeur += valeur;

      if (stock.quantite === 0) produitsEnRupture++;
      if (stock.alerteReapprovisionnement) produitsEnAlerte++;
      
      if (stock.datePeremption && new Date(stock.datePeremption) <= new Date()) {
        produitsPeremption++;
      }

      repartitionParEmplacement[stock.emplacement] = (repartitionParEmplacement[stock.emplacement] || 0) + stock.quantite;
    });

    return {
      totalProduits: stocks.length,
      totalValeur,
      produitsEnRupture,
      produitsEnAlerte,
      produitsPeremption,
      repartitionParEmplacement
    };
  }

  // Planifier une commande de réapprovisionnement
  async planReapprovisionnement(
    userId: number,
    productId: number,
    quantiteCommande: number,
    dateCommandeSouhaitee?: Date
  ): Promise<FranchiseStock> {
    const stock = await this.franchiseStockRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    if (!stock) {
      throw new BadRequestException('Stock non trouvé');
    }

    stock.quantiteCommande = quantiteCommande;
    stock.derniereCommande = dateCommandeSouhaitee || new Date();
    stock.alerteReapprovisionnement = false;

    return this.franchiseStockRepository.save(stock);
  }

  // Récupérer l'historique des commandes de réapprovisionnement
  async getReapprovisionnementHistory(userId: number): Promise<FranchiseStock[]> {
    return this.franchiseStockRepository.find({
      where: { user: { id: userId }, quantiteCommande: { $gt: 0 } as any },
      relations: ['product', 'product.warehouse'],
      order: { derniereCommande: 'DESC' }
    });
  }
}
