import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.warehouseService.getStats();
  }

  @Post('initialize')
  initializeWarehouses() {
    return this.warehouseService.initializeWarehouses();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.warehouseService.findById(id);
  }

  @Post()
  create(@Body() warehouse: any) {
    return this.warehouseService.create(warehouse);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: any) {
    return this.warehouseService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.warehouseService.remove(id);
  }
} 