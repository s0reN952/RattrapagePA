import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  findAll() {
    return this.productRepository.find({ 
      relations: ['warehouse'],
      order: { nom: 'ASC' }
    });
  }

  findByWarehouse(warehouseId: number) {
    return this.productRepository.find({ 
      where: { warehouse: { id: warehouseId } },
      relations: ['warehouse'],
      order: { nom: 'ASC' }
    });
  }

  findById(id: number) {
    return this.productRepository.findOne({ 
      where: { id },
      relations: ['warehouse']
    });
  }

  async create(productData: any) {
    const result = await this.productRepository.insert(productData);
    const createdId = result.identifiers[0].id;
    return this.productRepository.findOne({ where: { id: createdId } });
  }

  async update(id: number, data: any) {
    await this.productRepository.update({ id }, data);
    return this.findById(id);
  }

  async remove(id: number) {
    const result = await this.productRepository.delete({ id });
    if (result.affected === 0) {
      throw new Error('Produit non trouvé');
    }
    return { message: 'Produit supprimé avec succès' };
  }
}