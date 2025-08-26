import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FranchiseStockService } from './franchise-stock.service';
import { AuthGuard } from '@nestjs/passport';
import { DroitEntreeGuard } from '../payment/droit-entree.guard';

@Controller('franchise-stock')
@UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
export class FranchiseStockController {
  constructor(private readonly franchiseStockService: FranchiseStockService) {}

  // Récupérer le stock personnel du franchisé
  @Get('my')
  async getMyStock(@Req() req: any) {
    const userId = req.user.id;
    return this.franchiseStockService.getFranchiseStock(userId);
  }

  // Ajouter un produit au stock
  @Post('add')
  async addToStock(
    @Body() body: {
      productId: number;
      quantity: number;
      emplacement?: string;
      notes?: string;
    },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.franchiseStockService.addToStock(
      userId,
      body.productId,
      body.quantity,
      body.emplacement,
      body.notes
    );
  }

  // Mettre à jour le stock
  @Put('update/:productId')
  async updateStock(
    @Param('productId') productId: number,
    @Body() body: {
      quantity: number;
      emplacement?: string;
      notes?: string;
    },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.franchiseStockService.updateStock(
      userId,
      productId,
      body.quantity,
      body.emplacement,
      body.notes
    );
  }

  // Consommer du stock (pour les ventes)
  @Post('consume/:productId')
  async consumeStock(
    @Param('productId') productId: number,
    @Body() body: { quantity: number },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.franchiseStockService.consumeStock(
      userId,
      productId,
      body.quantity
    );
  }

  // Définir un seuil d'alerte personnalisé
  @Put('alert-threshold/:productId')
  async setAlertThreshold(
    @Param('productId') productId: number,
    @Body() body: { threshold: number },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.franchiseStockService.setAlertThreshold(
      userId,
      productId,
      body.threshold
    );
  }

  // Récupérer les alertes de réapprovisionnement
  @Get('alerts')
  async getReapprovisionnementAlerts(@Req() req: any) {
    const userId = req.user.id;
    return this.franchiseStockService.getReapprovisionnementAlerts(userId);
  }

  // Récupérer les statistiques de stock
  @Get('stats')
  async getStockStats(@Req() req: any) {
    const userId = req.user.id;
    return this.franchiseStockService.getStockStats(userId);
  }

  // Endpoint de test pour vérifier les données
  @Get('test-data')
  async testData(@Req() req: any) {
    const userId = req.user.id;
    try {
      // Test direct de la base de données
      const result = await this.franchiseStockService.getFranchiseStock(userId);
      return {
        success: true,
        userId,
        data: result,
        message: `Données récupérées: ${result.length} articles`
      };
    } catch (error) {
      return {
        success: false,
        userId,
        error: error.message,
        message: 'Erreur lors de la récupération des données'
      };
    }
  }

  // Endpoint de test pour vérifier directement la base
  @Get('debug-db')
  async debugDatabase(@Req() req: any) {
    const userId = req.user.id;
    try {
      // Vérifier directement dans la table franchise_stock
      const franchiseStock = await this.franchiseStockService['franchiseStockRepository'].find({
        where: { user: { id: userId } },
        relations: ['product', 'user']
      });

      // Vérifier les commandes
      const orders = await this.franchiseStockService['dataSource'].query(`
        SELECT o.id, o.userId, o.createdAt, oi.productId, oi.quantite
        FROM \`order\` o
        INNER JOIN order_item oi ON o.id = oi.orderId
        WHERE o.userId = ?
      `, [userId]);

      return {
        success: true,
        userId,
        franchiseStock: {
          count: franchiseStock.length,
          items: franchiseStock
        },
        orders: {
          count: orders.length,
          items: orders
        }
      };
    } catch (error) {
      return {
        success: false,
        userId,
        error: error.message
      };
    }
  }

  // Planifier une commande de réapprovisionnement
  @Post('plan-reapprovisionnement/:productId')
  async planReapprovisionnement(
    @Param('productId') productId: number,
    @Body() body: {
      quantiteCommande: number;
      dateCommandeSouhaitee?: Date;
    },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.franchiseStockService.planReapprovisionnement(
      userId,
      productId,
      body.quantiteCommande,
      body.dateCommandeSouhaitee
    );
  }

  // Récupérer l'historique des commandes de réapprovisionnement
  @Get('reapprovisionnement-history')
  async getReapprovisionnementHistory(@Req() req: any) {
    const userId = req.user.id;
    return this.franchiseStockService.getReapprovisionnementHistory(userId);
  }
}
