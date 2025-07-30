import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Injectable()
export class DroitEntreeGuard implements CanActivate {
  constructor(private paymentService: PaymentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Vérifier si le droit d'entrée est payé
    const droitEntreeStatus = await this.paymentService.getDroitEntreeStatus(user);
    
    if (!droitEntreeStatus.paid) {
      throw new ForbiddenException('Le droit d\'entrée de 50 000€ doit être payé avant d\'accéder à cette fonctionnalité');
    }

    return true;
  }
} 