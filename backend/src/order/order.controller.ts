import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '@nestjs/passport';
import { DroitEntreeGuard } from '../payment/droit-entree.guard';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), DroitEntreeGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Créer une nouvelle commande
  @Post()
  async createOrder(
    @Body() orderData: {
      warehouseId: number;
      items: Array<{
        productId: number;
        quantity: number;
        notes?: string;
      }>;
      adresseLivraison?: string;
      dateLivraisonSouhaitee?: Date;
      notes?: string;
    },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.orderService.createOrder(
      userId,
      orderData.warehouseId,
      orderData
    );
  }

  // Récupérer les commandes de l'utilisateur connecté
  @Get('my')
  async getMyOrders(@Req() req: any) {
    const userId = req.user.id;
    return this.orderService.findByUser(userId);
  }

  // Récupérer une commande spécifique
  @Get(':id')
  async getOrder(@Param('id') id: number, @Req() req: any) {
    const order = await this.orderService.findOne(id);
    if (order.user.id !== req.user.id) {
      throw new Error('Accès non autorisé');
    }
    return order;
  }

  // Annuler une commande
  @Delete(':id/cancel')
  async cancelOrder(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.orderService.cancelOrder(id, userId);
  }

  // Récupérer les statistiques d'achat
  @Get('stats/my')
  async getMyStats(@Req() req: any) {
    const userId = req.user.id;
    return this.orderService.getPurchaseStats(userId);
  }
} 