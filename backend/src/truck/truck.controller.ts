import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req, Request, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TruckService } from './truck.service';
import { AuthGuard } from '@nestjs/passport';
import { DroitEntreeGuard } from '../payment/droit-entree.guard';
import { Truck } from './truck.entity';

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

  @Post(':id/report-problem')
  async reportProblem(
    @Param('id') id: number,
    @Body() problemData: {
      panneDescription: string;
      emplacement?: string;
      zone?: string;
    },
    @Request() req: any
  ) {
    // Vérifier que l'utilisateur est connecté
    if (!req.user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Vérifier que l'utilisateur est un franchisé
    if (req.user.role !== 'franchise') {
      throw new ForbiddenException('Accès réservé aux franchisés');
    }

    // Vérifier que le camion appartient au franchisé
    const truck = await this.truckService.findOne(id);
    if (!truck || !truck.user || truck.user.id !== req.user.id) {
      throw new ForbiddenException('Vous ne pouvez signaler des problèmes que sur vos propres camions');
    }

    // Préparer les données de mise à jour
    const updateData: Partial<Truck> = {
      statut: 'en_panne',
      panneDescription: problemData.panneDescription,
      panneDate: new Date(),
      isOperational: false
    };
    
    if (problemData.emplacement) {
      updateData.emplacement = problemData.emplacement;
    }
    if (problemData.zone) {
      updateData.zone = problemData.zone;
    }

    const updatedTruck = await this.truckService.update(id, updateData, req.user);
    
    return {
      message: 'Problème signalé avec succès',
      truck: updatedTruck
    };
  }
} 