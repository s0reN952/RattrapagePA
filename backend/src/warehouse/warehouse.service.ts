import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  findAll() {
    return this.warehouseRepository.find({ 
      relations: ['produits'],
      order: { nom: 'ASC' }
    });
  }

  findById(id: number) {
    return this.warehouseRepository.findOne({ 
      where: { id },
      relations: ['produits']
    });
  }

  async create(warehouseData: any) {
    const result = await this.warehouseRepository.insert(warehouseData);
    const createdId = result.identifiers[0].id;
    return this.warehouseRepository.findOne({ where: { id: createdId } });
  }

  async update(id: number, data: any) {
    await this.warehouseRepository.update({ id }, data);
    return this.findById(id);
  }

  async remove(id: number) {
    const result = await this.warehouseRepository.delete({ id });
    if (result.affected === 0) {
      throw new Error('Entrepôt non trouvé');
    }
    return { message: 'Entrepôt supprimé avec succès' };
  }

  async getStats() {
    const warehouses = await this.warehouseRepository.find();
    
    const totalWarehouses = warehouses.length;
    const activeWarehouses = warehouses.filter(w => w.statut === 'actif').length;
    
    return {
      totalWarehouses,
      activeWarehouses
    };
  }

  async initializeWarehouses() {
    // Vérifier si les entrepôts existent déjà
    const existingWarehouses = await this.warehouseRepository.find();
    if (existingWarehouses.length > 0) {
      return { message: 'Entrepôts déjà initialisés' };
    }

    // Créer les 4 entrepôts d'Île-de-France
    const warehouses = [
      {
        nom: 'Paris Nord',
        adresse: '123 Rue de la Paix, 75001 Paris',
        description: 'Entrepôt principal avec cuisine moderne',
        statut: 'actif' as const
      },
      {
        nom: 'Paris Sud',
        adresse: '456 Avenue des Champs, 75006 Paris',
        description: 'Entrepôt spécialisé dans les desserts',
        statut: 'actif' as const
      },
      {
        nom: 'Paris Est',
        adresse: '789 Boulevard de la République, 75011 Paris',
        description: 'Entrepôt pour les boissons et ingrédients',
        statut: 'actif' as const
      },
      {
        nom: 'Paris Ouest',
        adresse: '321 Rue de Rivoli, 75008 Paris',
        description: 'Entrepôt pour les plats préparés',
        statut: 'actif' as const
      }
    ];

    for (const warehouse of warehouses) {
      await this.warehouseRepository.insert(warehouse);
    }

    return { message: '4 entrepôts d\'Île-de-France créés avec succès' };
  }
} 