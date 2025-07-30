import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckController } from './truck.controller';
import { TruckService } from './truck.service';
import { Truck } from './truck.entity';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Truck]), PaymentModule],
  controllers: [TruckController],
  providers: [TruckService],
  exports: [TruckService]
})
export class TruckModule {} 