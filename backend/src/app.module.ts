import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '././user/user.module';
import { AuthModule } from '././auth/auth.module';
import { TruckModule } from '././truck/truck.module';
import { OrderModule } from './order/order.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { SalesModule } from './sales/sales.module';
import { ProductModule } from './product/product.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'drivncook',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserModule,
    AuthModule,
    TruckModule,
    OrderModule,
    WarehouseModule,
    SalesModule,
    ProductModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 