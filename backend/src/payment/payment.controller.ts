import { Controller, Get, Post, Put, Param, UseGuards, Req, Inject, forwardRef, Body, Request, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from '../sales/sales.service';

@UseGuards(AuthGuard('jwt'))
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => SalesService))
    private readonly salesService: SalesService
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.paymentService.findAllByUser(req.user);
  }

  @Get('summary')
  getFinancialSummary(@Req() req: any) {
    return this.paymentService.getFinancialSummary(req.user);
  }

  @Get('droit-entree/status')
  async getDroitEntreeStatus(@Req() req: any) {
    return this.paymentService.getDroitEntreeStatus(req.user);
  }

  @Get('droit-entree/debug')
  async debugDroitEntreeStatus(@Req() req: any) {
    console.log('🔍 Debug - Utilisateur:', req.user?.id, req.user?.email);
    const status = await this.paymentService.getDroitEntreeStatus(req.user);
    console.log('🔍 Debug - Statut retourné:', status);
    return status;
  }

  @Get('droit-entree/check')
  checkDroitEntreePaid(@Req() req: any) {
    return this.paymentService.checkDroitEntreePaid(req.user);
  }

  @Post('droit-entree')
  createDroitEntree(@Req() req: any) {
    console.log('🔍 Utilisateur dans la requête:', req.user);
    
    if (!req.user) {
      throw new Error('Utilisateur non authentifié');
    }
    
    return this.paymentService.createDroitEntree(req.user);
  }

  @Post('stripe/confirm')
  async confirmStripePayment(@Body() body: { sessionId: string }, @Request() req) {
    return this.paymentService.processStripePayment(body.sessionId, req.user);
  }

  @Post('stripe/webhook')
  async handleStripeWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    return this.paymentService.handleStripeWebhook(body, signature);
  }

  @Post('calculate-commissions')
  async calculateCommissions(@Req() req: any) {
    // Récupérer les vraies ventes de l'utilisateur
    const sales = await this.salesService.findAllByUser(req.user);
    const commissionAmount = await this.paymentService.calculateCommissions(req.user, sales);
    const achatObligatoire = await this.paymentService.calculateAchatObligatoire(req.user, sales);
    
    return {
      commissionAmount,
      achatObligatoire,
      totalCA: sales.reduce((sum, s) => sum + Number(s.chiffre_affaires), 0)
    };
  }

  @Put(':id/pay')
  markAsPaid(@Param('id') id: number, @Req() req: any) {
    return this.paymentService.markAsPaid(id, req.user);
  }

  @Post('droit-entree/mark-paid')
  markDroitEntreeAsPaid(@Req() req: any) {
    console.log('🔧 Marquer le droit d\'entrée comme payé pour:', req.user?.id);
    return this.paymentService.markDroitEntreeAsPaid(req.user);
  }

  @Post('droit-entree/check-status')
  async checkDroitEntreeStatus(@Req() req: any) {
    console.log('🔍 Vérification détaillée du statut pour:', req.user?.id);
    return this.paymentService.checkDroitEntreeStatus(req.user);
  }

  @Post('droit-entree/sync-stripe')
  async syncStripeStatus(@Req() req: any) {
    console.log('🔄 Synchronisation Stripe pour:', req.user?.id);
    return this.paymentService.syncStripePaymentStatus(req.user);
  }
}