import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user.entity';

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await userService.findByEmail('admin2@drivncook.com');
    
    if (existingAdmin) {
      console.log('L\'administrateur existe déjà');
      return;
    }

    // Créer l'utilisateur admin (le mot de passe sera hashé par UserService)
    const adminUser = await userService.create({
      email: 'admin2@drivncook.com', // Email différent
      password: 'admin123', // Mot de passe en clair, sera hashé automatiquement
      nom: 'Administrateur',
      prenom: 'Driv\'n Cook',
      role: UserRole.SUPER_ADMIN,
      isActive: true
    });

    console.log('Administrateur créé avec succès:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    console.log('Identifiants de connexion:');
    console.log('Email: admin2@drivncook.com');
    console.log('Mot de passe: admin123');

  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await app.close();
  }
}

createAdmin(); 