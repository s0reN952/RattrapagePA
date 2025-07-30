import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { AuthGuard } from '@nestjs/passport';
import { DroitEntreeGuard } from '../payment/droit-entree.guard';

@Controller('sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.salesService.findAllByUser(req.user);
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.salesService.getStatsByUser(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.salesService.findById(+id, req.user);
  }

  @Post()
  @UseGuards(DroitEntreeGuard)
  create(@Body() sale: any, @Req() req: any) {
    return this.salesService.create(sale, req.user);
  }

  @Put(':id')
  @UseGuards(DroitEntreeGuard)
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.salesService.update(+id, data, req.user);
  }

  @Delete(':id')
  @UseGuards(DroitEntreeGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.salesService.remove(+id, req.user);
  }

  @Post('generate-report')
  generateReport(@Req() req: any) {
    return this.salesService.generateReport(req.user);
  }
} 