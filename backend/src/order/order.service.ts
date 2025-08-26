import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem } from './order.entity';
import { User } from '../user/user.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../product/product.entity';
import { FranchiseStockService } from '../product/franchise-stock.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private franchiseStockService: FranchiseStockService
  ) {}

  // Créer une nouvelle commande
  async createOrder(
    userId: number,
    warehouseId: number,
    orderData: {
      items: Array<{
        productId: number;
        quantity: number;
        notes?: string;
      }>;
      adresseLivraison?: string;
      dateLivraisonSouhaitee?: Date;
      notes?: string;
    }
  ): Promise<Order> {
    // Vérifier que l'entrepôt existe
    const warehouse = await this.orderRepository.manager.findOne(Warehouse, {
      where: { id: warehouseId }
    });

    if (!warehouse) {
      throw new BadRequestException('Entrepôt non trouvé');
    }

    // Calculer le montant total
    let montantTotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const orderItem of orderData.items) {
      const product = await this.productRepository.findOne({
        where: { id: orderItem.productId }
      });

      if (!product) {
        throw new BadRequestException(`Produit ${orderItem.productId} non trouvé`);
      }

      if (product.stock < orderItem.quantity) {
        throw new BadRequestException(`Stock insuffisant pour le produit ${product.nom}`);
      }

      const prixTotal = product.prix * orderItem.quantity;
      montantTotal += prixTotal;

      orderItems.push({
        product: { id: orderItem.productId } as Product,
        quantite: orderItem.quantity,
        prixUnitaire: product.prix,
        prixTotal,
        notes: orderItem.notes || null
      });
    }

    // Calculer les taxes
    const montantHorsTaxe = montantTotal / 1.20; // TVA 20%
    const montantTVA = montantTotal - montantHorsTaxe;
    const fraisLivraison = 0; // Gratuit pour l'instant
    const montantTTC = montantTotal + fraisLivraison;

    // Créer la commande
    const order = this.orderRepository.create({
      numeroCommande: this.generateOrderNumber(),
      user: { id: userId } as User,
      warehouseId: Number(warehouseId),
      montantTotal,
      fraisLivraison,
      montantHorsTaxe,
      montantTVA,
      montantTTC,
      adresseLivraison: orderData.adresseLivraison || '',
      dateLivraisonSouhaitee: orderData.dateLivraisonSouhaitee,
      notes: orderData.notes || '',
      statut: 'en_preparation'
    });

    const savedOrder = await this.orderRepository.save(order);

    // Créer les éléments de commande
    for (const item of orderItems) {
      await this.orderItemRepository.save({
        ...item,
        order: savedOrder
      });
    }

    // Mettre à jour les stocks de l'entrepôt
    for (const item of orderData.items) {
      await this.productRepository.update(
        { id: item.productId },
        { stock: () => `stock - ${item.quantity}` }
      );
    }

    // Ajouter automatiquement les produits achetés au stock du franchisé
    await this.addProductsToFranchiseStock(userId, orderData.items);

    return this.findOne(savedOrder.id);
  }

  // Nouvelle méthode pour ajouter les produits achetés au stock du franchisé
  private async addProductsToFranchiseStock(
    userId: number,
    items: Array<{ productId: number; quantity: number; notes?: string }>
  ): Promise<void> {
    try {
      for (const item of items) {
        await this.franchiseStockService.addToStock(
          userId,
          item.productId,
          item.quantity,
          'frigo', // Emplacement par défaut
          item.notes || `Achat du ${new Date().toLocaleDateString('fr-FR')}`
        );
      }
      console.log(`✅ Produits ajoutés au stock du franchisé ${userId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout au stock du franchisé ${userId}:`, error);
      // Ne pas faire échouer la commande si l'ajout au stock échoue
    }
  }

  // Générer un numéro de commande unique
  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `CMD-${year}-${timestamp}`;
  }

  // Récupérer une commande par ID
  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product']
    });
    
    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }
    
    return order;
  }

  // Récupérer les commandes d'un utilisateur
  async findByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' }
    });
  }

  // Annuler une commande
  async cancelOrder(orderId: number, userId: number): Promise<Order> {
    const order = await this.findOne(orderId);
    
    if (!order) {
      throw new BadRequestException('Commande non trouvée');
    }

    if (order.user.id !== userId) {
      throw new BadRequestException('Vous ne pouvez annuler que vos propres commandes');
    }

    if (order.statut !== 'en_preparation') {
      throw new BadRequestException('Impossible d\'annuler une commande déjà en cours');
    }

    // Remettre les stocks
    for (const item of order.items) {
      await this.productRepository.update(
        { id: item.product.id },
        { stock: () => `stock + ${item.quantite}` }
      );
    }

    // Marquer comme annulée
    order.statut = 'annulee';
    return this.orderRepository.save(order);
  }

  // Mettre à jour le statut d'une commande (pour les admins)
  async updateStatus(orderId: number, status: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (!order) {
      throw new BadRequestException('Commande non trouvée');
    }

    order.statut = status as any;
    
    if (status === 'livree') {
      order.dateLivraisonEffective = new Date();
    }

    return this.orderRepository.save(order);
  }

  // Calculer les statistiques d'achat d'un utilisateur
  async getPurchaseStats(userId: number): Promise<{
    totalCommandes: number;
    totalMontant: number;
    moyenneCommande: number;
    dernierAchat: Date | null;
    entrepotsUtilises: string[];
  }> {
    const orders = await this.findByUser(userId);

    const totalCommandes = orders.filter(o => o.statut !== 'annulee').length;
    const totalMontant = orders
      .filter(o => o.statut !== 'annulee')
      .reduce((sum, o) => sum + Number(o.montantTotal), 0);
    const moyenneCommande = totalCommandes > 0 ? totalMontant / totalCommandes : 0;
    const dernierAchat = orders.length > 0 ? orders[0].createdAt : null;
    const entrepotsUtilises = [...new Set(orders.map(o => o.warehouseId.toString()))];

    return {
      totalCommandes,
      totalMontant,
      moyenneCommande,
      dernierAchat,
      entrepotsUtilises
    };
  }
}