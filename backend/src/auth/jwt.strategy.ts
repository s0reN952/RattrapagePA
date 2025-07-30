import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'drivncook-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      // Récupérer l'utilisateur complet depuis la base de données
      const user = await this.userService.findById(payload.sub);
      
      if (!user) {
        console.error('❌ Utilisateur non trouvé dans la base de données:', payload.sub);
        return null;
      }
      
      console.log('✅ Utilisateur authentifié:', user.id, user.email);
      return user;
    } catch (error) {
      console.error('❌ Erreur lors de la validation JWT:', error);
      return null;
    }
  }
} 