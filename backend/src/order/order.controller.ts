import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '@nestjs/passport';
import { DroitEntreeGuard } from '../payment/droit-entree.guard';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.orderService.findAllByUser(req.user);
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.orderService.getStatsByUser(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.orderService.findById(+id, req.user);
  }

  @Post()
  @UseGuards(DroitEntreeGuard)
  create(@Body() order: any, @Req() req: any) {
    return this.orderService.create(order, req.user);
  }

  @Put(':id')
  @UseGuards(DroitEntreeGuard)
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.orderService.update(+id, data, req.user);
  }

  @Delete(':id')
  @UseGuards(DroitEntreeGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.orderService.remove(+id, req.user);
  }
} 