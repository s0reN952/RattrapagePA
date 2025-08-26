import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete, Request, BadRequestException } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { AuthGuard } from '@nestjs/passport';
import { DroitEntreeGuard } from '../payment/droit-entree.guard';
import { AdminGuard } from '../admin/admin.guard';
import { OrderService } from '../order/order.service';
import { FranchiseStockService } from '../product/franchise-stock.service';

@Controller('warehouses')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly orderService: OrderService,
    private readonly franchiseStockService: FranchiseStockService
  ) {}

  // ===== ENDPOINTS ADMIN (DOIVENT ÊTRE EN PREMIER) =====
  
  // Endpoints admin pour la gestion des entrepôts
  @Get('admin/warehouses')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getAllWarehouses() {
    console.log('[WarehouseController] getAllWarehouses() - Début de la requête');
    try {
      const warehouses = await this.warehouseService.findAll();
      console.log(`[WarehouseController] getAllWarehouses() - ${warehouses.length} entrepôts retournés`);
      return warehouses;
    } catch (error) {
      console.error('[WarehouseController] getAllWarehouses() - Erreur:', error);
      throw error;
    }
  }

  @Post('admin/warehouses')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async createWarehouse(@Body() warehouseData: any) {
    return this.warehouseService.createWarehouse(warehouseData);
  }

  @Put('admin/warehouses/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async updateWarehouse(@Param('id') id: number, @Body() warehouseData: any) {
    return this.warehouseService.updateWarehouse(id, warehouseData);
  }

  @Delete('admin/warehouses/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async deleteWarehouse(@Param('id') id: number) {
    return this.warehouseService.deleteWarehouse(id);
  }

  // Endpoints admin pour la gestion des produits
  @Get('admin/products')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getAllProductsAdmin() {
    return this.warehouseService.getAllProducts();
  }

  @Post('admin/products')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async createProduct(@Body() productData: any) {
    return this.warehouseService.createProduct(productData);
  }

  @Put('admin/products/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async updateProduct(@Param('id') id: number, @Body() productData: any) {
    return this.warehouseService.updateProduct(id, productData);
  }

  @Delete('admin/products/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async deleteProduct(@Param('id') id: number) {
    return this.warehouseService.deleteProduct(id);
  }

  @Get('admin/warehouses/:id/products')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getWarehouseWithProducts(@Param('id') id: number) {
    return this.warehouseService.getWarehouseWithProducts(id);
  }

  // ===== ENDPOINTS FRANCHISÉS =====

  // Créer une session de paiement pour l'achat de stock
  @Post('payment/create-session')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async createPaymentSession(
    @Body() paymentData: {
      items: Array<{
        product: any;
        quantite: number;
        prixTotal: number;
      }>;
      total: number;
      compliance: {
        percentage: number;
        isCompliant: boolean;
      };
      userEmail: string;
    },
    @Req() req: any
  ) {
    try {
      const userId = req.user.id;
      
      // Vérifier la conformité (80% Driv'n Cook)
      if (!paymentData.compliance.isCompliant) {
        throw new BadRequestException('La commande ne respecte pas la règle des 80%');
      }

      // Créer une vraie session Stripe
      const stripeService = new (await import('../payment/stripe.service')).StripeService();
      const session = await stripeService.createCheckoutSession(
        paymentData.total * 100, // Convertir en centimes pour Stripe
        'eur',
        userId,
        paymentData.userEmail,
        'stock_order',
        {
          userId: userId.toString(),
          orderType: 'stock_order',
          orderItems: JSON.stringify(paymentData.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantite,
            notes: `Achat via entrepôt ${item.product.warehouse?.nom || 'inconnu'}`
          }))),
          warehouseId: (paymentData.items[0]?.product?.warehouse?.id || 1).toString(),
          compliance: JSON.stringify(paymentData.compliance)
        }
      );

      // TEMPORAIRE : Ajouter directement au stock personnel (en attendant que le webhook fonctionne)
      try {
        for (const item of paymentData.items) {
          await this.franchiseStockService.addToStock(
            userId,
            item.product.id,
            item.quantite,
            'frigo',
            `Achat via entrepôt ${item.product.warehouse?.nom || 'inconnu'} - Session Stripe: ${session.id}`
          );
        }
        console.log(`✅ Stock personnel mis à jour directement pour l'utilisateur: ${userId}`);
      } catch (stockError) {
        console.error('⚠️ Erreur lors de l\'ajout direct au stock:', stockError);
        // Ne pas faire échouer la création de session si l'ajout au stock échoue
      }

      return {
        success: true,
        sessionId: session.id,
        sessionUrl: session.url
      };

    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      throw new BadRequestException(error.message || 'Erreur lors de la création de la session');
    }
  }

  // Traiter le webhook Stripe après paiement réussi
  @Post('payment/webhook')
  async handleStripeWebhook(@Body() event: any, @Req() req: any) {
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Vérifier que c'est un achat de stock
        if (session.metadata?.orderType === 'stock_order') {
          const userId = parseInt(session.metadata.userId || '0');
          
          // Récupérer les données de commande depuis les métadonnées
          const orderItems = JSON.parse(session.metadata.orderItems || '[]');
          const warehouseId = parseInt(session.metadata.warehouseId || '1');
          
          // Créer la commande et ajouter au stock personnel
          const orderData = {
            items: orderItems,
            warehouseId: warehouseId,
            adresseLivraison: 'Livraison directe à l\'entrepôt',
            notes: `Commande payée via Stripe - Session ${session.id}`,
            total: session.amount_total / 100
          };

          if (orderData.items.length > 0) {
            const order = await this.orderService.createOrder(userId, orderData.warehouseId, orderData);
            console.log(`✅ Commande créée après paiement Stripe: ${order.id}`);
            console.log(`✅ Stock personnel mis à jour pour l'utilisateur: ${userId}`);
          }
        }
      }

      return { received: true };
    } catch (error) {
      console.error('Erreur dans le webhook Stripe:', error);
      return { received: false, error: error.message };
    }
  }

  // Vérifier le statut d'une session de paiement
  @Post('payment/session-status')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async checkSessionStatus(@Body() body: { sessionId: string }, @Req() req: any) {
    try {
      const { sessionId } = body;
      
      // Vérifier le statut de la session Stripe
      const stripeService = new (await import('../payment/stripe.service')).StripeService();
      const session = await stripeService.getSessionStatus(sessionId);
      
      if (session.status === 'complete') {
        return {
          success: true,
          message: 'Paiement confirmé',
          sessionStatus: session.status
        };
      } else {
        return {
          success: false,
          message: 'Paiement en cours ou non complété',
          sessionStatus: session.status
        };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de la session:', error);
      throw new BadRequestException('Erreur lors de la vérification du statut');
    }
  }

  // Récupérer tous les entrepôts actifs
  @Get()
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async findAllActive() {
    return this.warehouseService.findAllActive();
  }

  // Récupérer tous les produits de tous les entrepôts
  @Get('products')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async getAllProducts() {
    return this.warehouseService.getAllProducts();
  }

  // Récupérer un entrepôt spécifique avec ses produits
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async findOne(@Param('id') id: number) {
    return this.warehouseService.findOne(id);
  }

  // Récupérer les produits d'un entrepôt
  @Get(':id/products')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async getProductsByWarehouse(@Param('id') id: number) {
    return this.warehouseService.getProductsByWarehouse(id);
  }

  // Récupérer les produits par catégorie dans un entrepôt
  @Get(':id/products/category/:category')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async getProductsByCategory(
    @Param('id') id: number,
    @Param('category') category: string
  ) {
    return this.warehouseService.getProductsByCategory(id, category);
  }

  // Calculer la conformité 80/20 pour le franchisé connecté
  @Get('compliance/my')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async getMyCompliance(@Req() req: any) {
    const userId = req.user.id;
    return this.warehouseService.calculateCompliance(userId);
  }

  // Récupérer l'historique des commandes du franchisé connecté
  @Get('orders/my')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async getMyOrderHistory(@Req() req: any) {
    const userId = req.user.id;
    return this.warehouseService.getOrderHistory(userId);
  }

  // Récupérer les statistiques d'achat du franchisé connecté
  @Get('stats/my')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async getMyPurchaseStats(@Req() req: any) {
    const userId = req.user.id;
    return this.warehouseService.getPurchaseStats(userId);
  }

  // Vérifier la disponibilité d'un produit
  @Post('products/:id/check-availability')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async checkProductAvailability(
    @Param('id') productId: number,
    @Body() body: { quantity: number }
  ) {
    const isAvailable = await this.warehouseService.checkProductAvailability(
      productId,
      body.quantity
    );
    return { isAvailable };
  }

  // Créer une nouvelle commande
  @Post('orders')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async createOrder(@Body() orderData: any, @Req() req: any) {
    const userId = req.user.id;
    return this.warehouseService.createOrder(userId, orderData);
  }

  // Traiter un paiement réussi (appelé par le webhook Stripe)
  @Post('payment/process-stock')
  @UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
  async processStockPurchase(@Body() orderData: any, @Req() req: any) {
    const userId = req.user.id;
    return this.warehouseService.createOrder(userId, orderData);
  }
} 