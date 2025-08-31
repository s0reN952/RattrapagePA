import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly complianceService: ComplianceService
  ) {}

  // 🚛 Gestion des camions
  @Post('trucks')
  async createTruck(@Body() truckData: any) {
    return this.adminService.createTruck(truckData);
  }

  @Get('trucks')
  async getTruckFleet() {
    return this.adminService.getTruckFleet();
  }

  @Get('trucks/available')
  async getAvailableTrucks() {
    return this.adminService.getAvailableTrucks();
  }

  @Post('trucks/:truckId/assign/:franchiseId')
  async assignTruckToFranchise(
    @Param('truckId') truckId: number,
    @Param('franchiseId') franchiseId: number
  ) {
    return this.adminService.assignTruckToFranchise(truckId, franchiseId);
  }

  @Post('trucks/:truckId/unassign')
  async unassignTruck(@Param('truckId') truckId: number) {
    return this.adminService.unassignTruck(truckId);
  }

  @Get('franchises/eligible-for-truck')
  async getFranchisesEligibleForTruck() {
    return this.adminService.getFranchisesEligibleForTruck();
  }

  @Put('trucks/:truckId/maintenance')
  async updateTruckMaintenance(
    @Param('truckId') truckId: number,
    @Body() maintenanceData: any
  ) {
    return this.adminService.updateTruckMaintenance(truckId, maintenanceData);
  }

  // 🚛 Gestion avancée des camions
  @Post('trucks/:id/breakdown')
  async reportTruckBreakdown(
    @Param('id') id: number,
    @Body() breakdownData: any
  ) {
    return this.adminService.reportTruckBreakdown(id, breakdownData);
  }

  @Post('trucks/:id/resolve')
  async resolveTruckBreakdown(
    @Param('id') id: number,
    @Body() resolutionData: any
  ) {
    return this.adminService.resolveTruckBreakdown(id, resolutionData);
  }

  @Put('trucks/:id/location')
  async updateTruckLocation(
    @Param('id') id: number,
    @Body() locationData: any
  ) {
    return this.adminService.updateTruckLocation(id, locationData);
  }

  @Post('trucks/:id/schedule-maintenance')
  async scheduleMaintenance(
    @Param('id') id: number,
    @Body() maintenanceData: any
  ) {
    return this.adminService.scheduleMaintenance(id, maintenanceData);
  }

  @Get('trucks/:id/maintenance-history')
  async getTruckMaintenanceHistory(@Param('id') id: number) {
    return this.adminService.getTruckMaintenanceHistory(id);
  }

  @Get('trucks/maintenance/schedule')
  async getMaintenanceSchedule() {
    return this.adminService.getMaintenanceSchedule();
  }

  @Get('trucks/zone/:zone')
  async getTrucksByZone(@Param('zone') zone: string) {
    return this.adminService.getTrucksByZone(zone);
  }

  @Get('trucks/operational')
  async getOperationalTrucks() {
    return this.adminService.getOperationalTrucks();
  }

  // 👥 Gestion des franchisés
  @Get('franchises')
  async getAllFranchises() {
    return this.adminService.getAllFranchisesWithMetrics();
  }

  @Get('franchises/:id')
  async getFranchiseById(@Param('id') id: number) {
    return this.adminService.getFranchiseById(id);
  }

  @Put('franchises/:id/validate')
  async validateFranchise(
    @Param('id') id: number,
    @Body() validationData: any
  ) {
    return this.adminService.validateFranchise(id, validationData);
  }

  @Put('franchises/:id/status')
  async updateFranchiseStatus(
    @Param('id') id: number,
    @Body() statusData: any
  ) {
    return this.adminService.updateFranchiseStatus(id, statusData);
  }

  @Get('franchises/:id/performance')
  async getFranchisePerformance(
    @Param('id') id: number,
    @Query('period') period: string
  ) {
    return this.adminService.getFranchisePerformance(id, period as any);
  }

  @Get('franchises/:id/support')
  async getFranchiseSupport(@Param('id') id: number) {
    return this.adminService.getFranchiseSupport(id);
  }

  @Post('franchises/:id/notes')
  async addFranchiseNote(
    @Param('id') id: number,
    @Body() noteData: any
  ) {
    return this.adminService.addFranchiseNote(id, noteData);
  }

  // 💰 Suivi financier
  @Get('financial/overview')
  async getFinancialOverview() {
    return this.adminService.getFinancialOverview();
  }

  // 📈 Rapports et statistiques
  @Get('reports/sales')
  async generateSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.adminService.generateSalesReport(
      new Date(startDate),
      new Date(endDate)
    );
  }

  // 📊 Génération automatique de rapports
  @Post('reports/generate/monthly')
  async generateMonthlyReport() {
    return this.adminService.generateAutomaticReport('monthly');
  }

  @Post('reports/generate/quarterly')
  async generateQuarterlyReport() {
    return this.adminService.generateAutomaticReport('quarterly');
  }

  @Get('reports/available')
  async getAvailableReports() {
    // Lister les rapports disponibles dans le dossier reports
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.join(process.cwd(), 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      return { reports: [] };
    }

    const files = fs.readdirSync(reportsDir);
    const reports = files
      .filter(file => file.endsWith('.pdf'))
      .map(file => {
        const stats = fs.statSync(path.join(reportsDir, file));
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          type: file.includes('monthly') ? 'monthly' : file.includes('quarterly') ? 'quarterly' : 'custom'
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return { reports };
  }

  @Get('reports/download/:filename')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async downloadReport(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'reports');
      const filePath = path.join(reportsDir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Fichier non trouvé' });
      }

      // Lire le fichier et le servir
      const fileBuffer = fs.readFileSync(filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      return res.send(fileBuffer);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      return res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
  }

  @Get('reports/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listReports(): Promise<any> {
    try {
      // 🚀 Générer automatiquement les rapports s'ils n'existent pas
      await this.adminService.generateAutomaticReportsIfNeeded();
      
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'reports');
      
      if (!fs.existsSync(reportsDir)) {
        return { reports: [] };
      }

      const files = fs.readdirSync(reportsDir);
      const adminReports = files
        .filter(file => file.startsWith('rapport-admin-'))
        .map(file => {
          const filePath = path.join(reportsDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { reports: adminReports };
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      throw new InternalServerErrorException('Erreur lors de la récupération des rapports');
    }
  }

  // 🏢 Gestion des entrepôts
  @Get('warehouses/:id/inventory')
  async getWarehouseInventory(@Param('id') id: number) {
    return this.adminService.getWarehouseInventory(id);
  }

  @Put('products/:id/stock')
  async updateProductStock(
    @Param('id') id: number,
    @Body('quantity') quantity: number
  ) {
    return this.adminService.updateProductStock(id, quantity);
  }

  // 🔐 Gestion des admins
  @Post('admins')
  async createAdmin(@Body() adminData: any) {
    return this.adminService.createAdmin(adminData);
  }

  @Get('admins')
  async getAdminUsers() {
    return this.adminService.getAdminUsers();
  }

  // 📊 Récupérer la vue d'ensemble de conformité
  @Get('compliance/overview')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getComplianceOverview(@Query('period') period: 'monthly' | 'quarterly' = 'monthly') {
    try {
      const overview = await this.complianceService.getComplianceOverview(period);
      return overview;
    } catch (error) {
      console.error('Erreur lors de la récupération de la vue d\'ensemble de conformité:', error);
      throw new BadRequestException('Erreur lors de la récupération des données de conformité');
    }
  }

  // 🔄 Vérifier la conformité de tous les franchisés
  @Post('compliance/check-all')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async checkAllFranchisesCompliance(@Body() data: { month: number; year: number; period: 'monthly' | 'quarterly' }) {
    try {
      const results = await this.complianceService.checkAllFranchisesCompliance(data.month, data.year);
      return { 
        success: true, 
        message: `Contrôle de conformité effectué pour ${results.length} franchisés`,
        results 
      };
    } catch (error) {
      console.error('Erreur lors du contrôle de conformité:', error);
      throw new BadRequestException('Erreur lors du contrôle de conformité');
    }
  }

  // 📊 Générer un rapport de conformité
  @Get('compliance/report')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async generateComplianceReport(@Query('period') period: 'monthly' | 'quarterly' = 'monthly') {
    try {
      const report = await this.complianceService.generateComplianceReport({ period });
      return report;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw new BadRequestException('Erreur lors de la génération du rapport');
    }
  }

  // 📊 Dashboard principal
  @Get('dashboard')
  async getDashboard() {
    const [financialOverview, franchiseCompliance, truckFleet] = await Promise.all([
      this.adminService.getFinancialOverview(),
      this.adminService.getFranchiseCompliance(),
      this.adminService.getTruckFleet()
    ]);

    return {
      financial: financialOverview,
      franchises: {
        total: franchiseCompliance.length,
        active: franchiseCompliance.filter(f => f.compliance.entryFee).length,
        compliant: franchiseCompliance.filter(f => 
          f.compliance.entryFee && 
          f.compliance.commissionPaid && 
          f.compliance.mandatoryPurchases
        ).length
      },
      trucks: {
        total: truckFleet.length,
        assigned: truckFleet.filter(t => t.isAssigned).length,
        available: truckFleet.filter(t => !t.isAssigned).length
      }
    };
  }

  // 📊 Dashboard et statistiques
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
} 