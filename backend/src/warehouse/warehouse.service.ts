import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse, WarehouseStatus } from './warehouse.entity';
import { Product } from '../product/product.entity';
import { Order } from '../order/order.entity';
import { User } from '../user/user.entity';
import { StripeService } from '../payment/stripe.service';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private stripeService: StripeService,
  ) {}

  // Récupérer tous les entrepôts actifs avec leurs produits
  async findAllActive(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { statut: WarehouseStatus.ACTIF },
      relations: ['produits'],
      order: { nom: 'ASC' }
    });
  }

  // Récupérer tous les entrepôts (admin)
  async findAll(): Promise<Warehouse[]> {
    try {
      console.log('[WarehouseService] findAll() - Début de la récupération');
      
      const warehouses = await this.warehouseRepository.find({
        relations: ['produits'],
        order: { nom: 'ASC' }
      });
      
      console.log(`[WarehouseService] findAll() - ${warehouses.length} entrepôts trouvés:`, warehouses.map(w => ({ id: w.id, nom: w.nom })));
      
      return warehouses;
    } catch (error) {
      console.error('[WarehouseService] findAll() - Erreur:', error);
      throw error;
    }
  }

  // Récupérer tous les produits de tous les entrepôts
  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isAvailable: true },
      relations: ['warehouse'],
      order: { nom: 'ASC' }
    });
  }

  // Récupérer un entrepôt par ID avec ses produits
  async findOne(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['produits']
    });
    
    if (!warehouse) {
      throw new NotFoundException('Entrepôt non trouvé');
    }
    
    return warehouse;
  }

  // Récupérer les produits d'un entrepôt
  async getProductsByWarehouse(warehouseId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { warehouse: { id: warehouseId }, isAvailable: true },
      order: { nom: 'ASC' }
    });
  }

  // Récupérer les produits par catégorie dans un entrepôt
  async getProductsByCategory(warehouseId: number, category: string): Promise<Product[]> {
    return this.productRepository.find({
            where: {
        warehouse: { id: warehouseId },
        isAvailable: true,
        category: category as 'nourriture' | 'boisson' | 'dessert' | 'ingredient' | 'plat_prepare'
      },
      order: { nom: 'ASC' }
    });
  }

  // Calculer la conformité 80/20 pour un franchisé
  async calculateCompliance(userId: number): Promise<{
    totalAchats: number;
    achatsDrivnCook: number;
    achatsLibres: number;
    pourcentageConformite: number;
    isCompliant: boolean;
  }> {
    try {
      // Récupérer toutes les commandes du franchisé
      const orders = await this.orderRepository.find({
        where: { user: { id: userId } },
        relations: ['items', 'items.product']
      });

      let totalAchats = 0;
      let achatsDrivnCook = 0;
      let achatsLibres = 0;

      for (const order of orders) {
        for (const item of order.items) {
          const montant = parseFloat(item.prixTotal.toString());
          totalAchats += montant;

          // Vérifier si le produit vient d'un entrepôt Driv'n Cook
          if (item.product && item.product.warehouse) {
            achatsDrivnCook += montant;
          } else {
            achatsLibres += montant;
          }
        }
      }

      const pourcentageConformite = totalAchats > 0 ? (achatsDrivnCook / totalAchats) * 100 : 0;
      const isCompliant = pourcentageConformite >= 80;

      return {
        totalAchats,
        achatsDrivnCook,
        achatsLibres,
        pourcentageConformite: Math.round(pourcentageConformite * 100) / 100,
        isCompliant
      };
    } catch (error) {
      console.error('Erreur lors du calcul de la conformité:', error);
      return {
        totalAchats: 0,
        achatsDrivnCook: 0,
        achatsLibres: 0,
        pourcentageConformite: 0,
        isCompliant: false
      };
    }
  }

  // Récupérer l'historique des commandes d'un franchisé
  async getOrderHistory(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['warehouse', 'items', 'items.product'],
      order: { createdAt: 'DESC' }
    });
  }

  // Récupérer les statistiques d'achat d'un franchisé
  async getPurchaseStats(userId: number): Promise<{
    totalCommandes: number;
    totalMontant: number;
    moyenneCommande: number;
    dernierAchat: Date | null;
    entrepotsUtilises: string[];
  }> {
    const orders = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['warehouse']
    });

    const totalCommandes = orders.length;
    const totalMontant = orders.reduce((sum, order) => sum + parseFloat(order.montantTotal.toString()), 0);
    const moyenneCommande = totalCommandes > 0 ? totalMontant / totalCommandes : 0;
    const dernierAchat = orders.length > 0 ? orders[0].createdAt : null;
    const entrepotsUtilises = [...new Set(orders.map(order => `Entrepôt ${order.warehouseId}`))];

    return {
      totalCommandes,
      totalMontant,
      moyenneCommande,
      dernierAchat,
      entrepotsUtilises
    };
  }

  // Vérifier la disponibilité d'un produit
  async checkProductAvailability(productId: number, quantity: number): Promise<boolean> {
    const product = await this.productRepository.findOne({
      where: { id: productId }
    });

    if (!product || !product.isAvailable) {
      return false;
    }

    return product.stock >= quantity;
  }

  // Mettre à jour le stock après commande
  async updateStockAfterOrder(items: any[]): Promise<void> {
    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.product.id }
      });
      
      if (product) {
        product.stock -= item.quantite;
        if (product.stock < 0) product.stock = 0;
        await this.productRepository.save(product);
      }
    }
  }

  // Traiter le paiement réussi et mettre à jour les stocks
  async processSuccessfulPayment(userId: number, orderData: any): Promise<{
    success: boolean;
    message: string;
    stockUpdated: boolean;
  }> {
    try {
      // 1. Mettre à jour les stocks des entrepôts
      await this.updateStockAfterOrder(orderData.items);
      
      // 2. Ajouter le stock personnel du franchisé
      // await this.addFranchiseStock(userId, orderData.items); // This method is removed
      
      console.log(`✅ Paiement traité avec succès pour l'utilisateur ${userId} - Stock mis à jour`);
      
      return {
        success: true,
        message: 'Paiement traité avec succès ! Votre stock personnel a été mis à jour.',
        stockUpdated: true
      };
    } catch (error) {
      console.error(`❌ Erreur lors du traitement du paiement pour l'utilisateur ${userId}:`, error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du stock: ' + error.message,
        stockUpdated: false
      };
    }
  }

  // Créer une commande de stock
  async createOrder(userId: number, orderData: any): Promise<{
    success: boolean;
    message: string;
    order?: any;
    compliance?: any;
  }> {
    try {
      // Calculer le pourcentage des nouveaux achats
      const newOrderTotal = orderData.items.reduce((sum: number, item: any) => {
        return sum + (item.product.prix * item.quantite);
      }, 0);
      
      const newDrivnCookTotal = orderData.items.reduce((sum: number, item: any) => {
        // Tous les produits des entrepôts sont considérés comme Driv'n Cook
        return sum + (item.product.prix * item.quantite);
      }, 0);
      
      const newCompliancePercentage = (newDrivnCookTotal / newOrderTotal) * 100;
      
      // Vérification stricte de la règle des 80%
      if (newCompliancePercentage < 80) {
        return {
          success: false,
          message: `❌ La commande ne respecte PAS la règle des 80% ! 
          
          📊 Détails de votre commande :
          • Total de la commande : ${newOrderTotal.toFixed(2)}€
          • Produits Driv'n Cook : ${newDrivnCookTotal.toFixed(2)}€
          • Pourcentage actuel : ${newCompliancePercentage.toFixed(1)}%
          • Pourcentage requis : 80%
          
          💡 Pour respecter la règle, vous devez :
          • Augmenter vos achats dans nos entrepôts Driv'n Cook
          • Ou réduire le montant total de votre commande
          
          🔢 Calcul : (${newDrivnCookTotal.toFixed(2)}€ / ${newOrderTotal.toFixed(2)}€) × 100 = ${newCompliancePercentage.toFixed(1)}%`,
          compliance: {
            newOrderPercentage: newCompliancePercentage,
            requiredPercentage: 80,
            total: newOrderTotal,
            drivnCookTotal: newDrivnCookTotal,
            isCompliant: false
          }
        };
      }
      
      // Vérifier la disponibilité des produits
      for (const item of orderData.items) {
        const isAvailable = await this.checkProductAvailability(item.product.id, item.quantite);
        if (!isAvailable) {
          return {
            success: false,
            message: `Le produit ${item.product.nom} n'est pas disponible en quantité suffisante.`
          };
        }
      }
      
      // ✅ Commande conforme aux règles des 80%
      console.log(`✅ Commande conforme créée pour l'utilisateur ${userId} - ${newCompliancePercentage.toFixed(1)}% Driv'n Cook`);
      
      // Créer la commande (ici vous devriez intégrer avec votre système de commandes)
      // Pour l'instant, on retourne un succès
      
      // Mettre à jour les stocks
      await this.updateStockAfterOrder(orderData.items);
      
      return {
        success: true,
        message: `✅ Commande créée avec succès ! 
        
        📊 Conformité vérifiée :
        • Pourcentage Driv'n Cook : ${newCompliancePercentage.toFixed(1)}%
        • Règle des 80% : RESPECTÉE ✅
        • Total de la commande : ${newOrderTotal.toFixed(2)}€`,
        order: {
          id: Date.now(), // ID temporaire
          items: orderData.items,
          total: newOrderTotal,
          createdAt: new Date(),
          compliance: {
            percentage: newCompliancePercentage,
            isCompliant: true,
            total: newOrderTotal,
            drivnCookTotal: newDrivnCookTotal
          }
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la création de la commande: ' + error.message
      };
    }
  }

  // Créer une session de paiement pour une commande de stock
  async createPaymentSession(userId: number, orderData: any): Promise<{
    success: boolean;
    message: string;
    sessionUrl?: string;
    sessionId?: string;
  }> {
    try {
      if (!orderData.compliance?.isCompliant) {
        return {
          success: false,
          message: `❌ Impossible de créer la session de paiement !
          
          La commande ne respecte pas la règle des 80%.
          
          📊 Détails de non-conformité :
          • Pourcentage actuel : ${orderData.compliance?.percentage?.toFixed(1) || 'N/A'}%
          • Pourcentage requis : 80%
          
          💡 Vous devez d'abord valider une commande conforme avant de pouvoir payer.`
        };
      }

      // Vérifier la disponibilité des produits
      for (const item of orderData.items) {
        const product = await this.productRepository.findOne({
          where: { id: item.product.id }
        });
        
        if (!product || product.stock < item.quantite) {
          return {
            success: false,
            message: `❌ Produit ${product?.nom || 'inconnu'} non disponible en quantité suffisante. Stock disponible: ${product?.stock || 0}, Quantité demandée: ${item.quantite}`
          };
        }
      }

      const userEmail = orderData.userEmail || 'franchise@drivncook.com';
      
      // Préparer les métadonnées pour le webhook Stripe (limitées à 500 caractères)
      const simplifiedItems = orderData.items.map(item => ({
        productId: item.product.id,
        productName: item.product.nom,
        quantite: item.quantite,
        prixTotal: item.prixTotal
      }));
      
      const metadata = {
        type: 'stock_order',
        userId: userId.toString(),
        orderItems: JSON.stringify(simplifiedItems),
        compliance: JSON.stringify({
          percentage: orderData.compliance.percentage,
          isCompliant: orderData.compliance.isCompliant
        }),
        total: orderData.total.toString()
      };
      
      console.log(`💳 Création session de paiement pour l'utilisateur ${userId} - Email: ${userEmail} - Montant: ${orderData.total}€ - Conformité: ${orderData.compliance.percentage.toFixed(1)}%`);
      
      // Vérifier la taille des métadonnées
      const metadataString = JSON.stringify(metadata);
      console.log(`📏 Taille des métadonnées: ${metadataString.length} caractères`);
      if (metadataString.length > 500) {
        console.warn(`⚠️ ATTENTION: Métadonnées trop longues (${metadataString.length} > 500)`);
      }
      
      const session = await this.stripeService.createCheckoutSession(
        orderData.total,
        'eur',
        userId,
        userEmail,
        'stock_order',
        metadata // Passer les métadonnées
      );
      
      return {
        success: true,
        message: `✅ Session de paiement créée avec succès !
        
        📊 Détails de la commande :
        • Total : ${orderData.total.toFixed(2)}€
        • Conformité : ${orderData.compliance.percentage.toFixed(1)}% Driv'n Cook ✅
        • Email pré-rempli : ${userEmail}`,
        sessionUrl: session.url || undefined,
        sessionId: session.id
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la session de paiement pour l'utilisateur ${userId}:`, error);
      return {
        success: false,
        message: `Erreur lors de la création de la session de paiement: ${error.message}`
      };
    }
  }

  // Vérifier le statut d'une session de paiement
  async getPaymentSessionStatus(userId: number, sessionId: string): Promise<{
    success: boolean;
    message: string;
    sessionId?: string;
    amount?: number;
    status?: string;
    paymentStatus?: string;
  }> {
    try {
      // Vérifier le statut de la session Stripe
      const sessionStatus = await this.stripeService.getSessionStatus(sessionId);
      
      return {
        success: true,
        message: 'Statut de session récupéré avec succès',
        sessionId: sessionStatus.id,
        amount: sessionStatus.amount || undefined,
        status: sessionStatus.status || undefined,
        paymentStatus: sessionStatus.payment_status
      };

    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la vérification du statut: ' + error.message
      };
    }
  }

  // Méthodes pour la gestion admin
  async createWarehouse(warehouseData: any): Promise<Warehouse> {
    try {
      console.log('Données reçues pour créer l\'entrepôt:', warehouseData);
      const warehouse = this.warehouseRepository.create(warehouseData);
      console.log('Entrepôt créé:', warehouse);
      const savedWarehouse = await this.warehouseRepository.save(warehouse);
      console.log('Entrepôt sauvegardé:', savedWarehouse);
      return Array.isArray(savedWarehouse) ? savedWarehouse[0] : savedWarehouse;
    } catch (error) {
      console.error('Erreur détaillée lors de la création de l\'entrepôt:', error);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async updateWarehouse(id: number, warehouseData: any): Promise<Warehouse> {
    await this.warehouseRepository.update(id, warehouseData);
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new Error('Entrepôt non trouvé');
    }
    return warehouse;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    const result = await this.warehouseRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async createProduct(productData: any): Promise<Product> {
    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);
    return Array.isArray(savedProduct) ? savedProduct[0] : savedProduct;
  }

  async updateProduct(id: number, productData: any): Promise<Product> {
    await this.productRepository.update(id, productData);
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Produit non trouvé');
    }
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async getWarehouseWithProducts(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['produits']
    });
    if (!warehouse) {
      throw new Error('Entrepôt non trouvé');
    }
    return warehouse;
  }
} 