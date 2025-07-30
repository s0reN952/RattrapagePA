import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../user/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  findAllByUser(user: User) {
    return this.orderRepository.find({ 
      where: { user: { id: user.id } },
      order: { date_creation: 'DESC' }
    });
  }

  findById(id: number, user: User) {
    return this.orderRepository.findOne({ where: { id, user: { id: user.id } } });
  }

  async create(order: Partial<Order>, user: User) {
    // Générer un numéro de commande unique
    const date = new Date();
    const numero = `CMD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const result = await this.orderRepository.insert({
      ...order, 
      numero,
      user: { id: user.id }
    });
    return this.orderRepository.findOne({ where: { id: result.identifiers[0].id } });
  }

  async update(id: number, data: Partial<Order>, user: User) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const existingOrder = await this.orderRepository.findOne({ 
      where: { id, user: { id: user.id } } 
    });
    
    if (!existingOrder) {
      throw new Error('Commande non trouvée');
    }

    // Vérifier que data n'est pas vide
    if (!data || Object.keys(data).length === 0) {
      return existingOrder;
    }

    await this.orderRepository.update({ id }, data);
    return this.orderRepository.findOne({ where: { id, user: { id: user.id } } });
  }

  async remove(id: number, user: User) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const existingOrder = await this.orderRepository.findOne({ 
      where: { id, user: { id: user.id } } 
    });
    
    if (!existingOrder) {
      throw new Error('Commande non trouvée');
    }

    const result = await this.orderRepository.delete({ id });
    
    if (result.affected === 0) {
      throw new Error('Erreur lors de la suppression');
    }

    return { message: 'Commande supprimée avec succès' };
  }

  async getStatsByUser(user: User) {
    const orders = await this.orderRepository.find({ where: { user: { id: user.id } } });
    
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.montant), 0);
    const pendingOrders = orders.filter(order => order.statut === 'en_attente').length;
    const deliveredOrders = orders.filter(order => order.statut === 'livree').length;
    
    return {
      totalOrders,
      totalAmount,
      pendingOrders,
      deliveredOrders,
      averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0
    };
  }
} 