import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { TruckService } from './truck.service';
import { AuthGuard } from '@nestjs/passport';
import { DroitEntreeGuard } from '../payment/droit-entree.guard';

@Controller('trucks')
@UseGuards(AuthGuard('jwt'))
export class TruckController {
  constructor(private readonly truckService: TruckService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.truckService.findAllByUser(req.user);
  }

  @Post()
  @UseGuards(DroitEntreeGuard)
  create(@Body() truck: any, @Req() req: any) {
    return this.truckService.create(truck, req.user);
  }

  @Put(':id')
  @UseGuards(DroitEntreeGuard)
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.truckService.update(+id, data, req.user);
  }

  @Delete(':id')
  @UseGuards(DroitEntreeGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.truckService.remove(+id, req.user);
  }
} 