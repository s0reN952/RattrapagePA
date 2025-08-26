import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { Warehouse } from './warehouse.entity';
import { Product } from '../product/product.entity';
import { Order } from '../order/order.entity';
import { OrderItem } from '../order/order.entity';
import { PaymentModule } from '../payment/payment.module';
import { OrderModule } from '../order/order.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, Product, Order, OrderItem]),
    PaymentModule,
    OrderModule,
    ProductModule
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService]
})
export class WarehouseModule {} 