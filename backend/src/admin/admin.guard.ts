import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../user/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }
} 