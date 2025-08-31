import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ComplianceService } from './compliance.service';
import { User } from '../user/user.entity';
import { Truck } from '../truck/truck.entity';
import { Order } from '../order/order.entity';
import { Sales } from '../sales/sales.entity';
import { Payment } from '../payment/payment.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Product } from '../product/product.entity';
import { FranchiseStock } from '../product/franchise-stock.entity';
import { ComplianceRecord } from './compliance-record.entity';
import { UserModule } from '../user/user.module';
import { TruckModule } from '../truck/truck.module';
import { OrderModule } from '../order/order.module';
import { SalesModule } from '../sales/sales.module';
import { PaymentModule } from '../payment/payment.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Truck,
      Order,
      Sales,
      Payment,
      Warehouse,
      Product,
      FranchiseStock,
      ComplianceRecord
    ]),
    UserModule,
    TruckModule,
    OrderModule,
    SalesModule,
    PaymentModule,
    WarehouseModule,
    ProductModule
  ],
  controllers: [AdminController],
  providers: [AdminService, ComplianceService],
  exports: [AdminService, ComplianceService]
})
export class AdminModule {} 