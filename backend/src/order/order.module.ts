import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderItem } from './order.entity';
import { PaymentModule } from '../payment/payment.module';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]), 
    PaymentModule,
    ProductModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService]
})
export class OrderModule {} 