import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { Warehouse } from './warehouse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])],
  controllers: [WarehouseController],
  providers: [WarehouseService],
})
export class WarehouseModule {} 