import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { FranchiseStock } from './franchise-stock.entity';
import { FranchiseStockService } from './franchise-stock.service';
import { FranchiseStockController } from './franchise-stock.controller';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, FranchiseStock]), PaymentModule],
  controllers: [ProductController, FranchiseStockController],
  providers: [ProductService, FranchiseStockService],
  exports: [ProductService, FranchiseStockService],
})
export class ProductModule {}