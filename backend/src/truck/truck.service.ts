import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from './truck.entity';
import { User } from '../user/user.entity';

@Injectable()
export class TruckService {
  constructor(
    @InjectRepository(Truck)
    private truckRepository: Repository<Truck>,
  ) {}

  findAllByUser(user: User) {
    return this.truckRepository.find({ where: { user: { id: user.id } } });
  }

  async create(truck: Partial<Truck>, user: User) {
    const result = await this.truckRepository.insert({
      ...truck,
      user: { id: user.id }
    });
    return this.truckRepository.findOne({ where: { id: result.identifiers[0].id } });
  }

  async update(id: number, data: Partial<Truck>, user: User) {
    // Vérifier que le camion existe et appartient à l'utilisateur
    const existingTruck = await this.truckRepository.findOne({ 
      where: { id, user: { id: user.id } } 
    });
    
    if (!existingTruck) {
      throw new Error('Camion non trouvé');
    }

    // Vérifier que data n'est pas vide
    if (!data || Object.keys(data).length === 0) {
      return existingTruck;
    }

    await this.truckRepository.update({ id }, data);
    return this.truckRepository.findOne({ where: { id, user: { id: user.id } } });
  }

  async remove(id: number, user: User) {
    // Vérifier que le camion existe et appartient à l'utilisateur
    const existingTruck = await this.truckRepository.findOne({ 
      where: { id, user: { id: user.id } } 
    });
    
    if (!existingTruck) {
      throw new Error('Camion non trouvé');
    }

    const result = await this.truckRepository.delete({ id });
    
    if (result.affected === 0) {
      throw new Error('Erreur lors de la suppression');
    }

    return { message: 'Camion supprimé avec succès' };
  }
} 