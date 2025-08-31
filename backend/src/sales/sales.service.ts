import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sales } from './sales.entity';
import { User } from '../user/user.entity';
import { PaymentService } from '../payment/payment.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sales)
    private salesRepository: Repository<Sales>,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService
  ) {}

  findAllByUser(user: User) {
    return this.salesRepository.find({ 
      where: { user: { id: user.id } },
      order: { date_creation: 'DESC' }
    });
  }

  findById(id: number, user: User) {
    return this.salesRepository.findOne({ where: { id, user: { id: user.id } } });
  }

  async create(salesData: any, user: User) {
    const chiffreAffaires = Number(salesData.chiffre_affaires);
    const coutsOperationnels = Number(salesData.couts_operationnels);
    const nombreCommandes = Number(salesData.nombre_commandes);
    
    const margeBrute = chiffreAffaires - coutsOperationnels;
    const tauxMarge = chiffreAffaires > 0 ? (margeBrute / chiffreAffaires) * 100 : 0;
    const panierMoyen = nombreCommandes > 0 ? chiffreAffaires / nombreCommandes : 0;

    const result = await this.salesRepository.insert({
      periode: salesData.periode,
      chiffre_affaires: chiffreAffaires,
      couts_operationnels: coutsOperationnels,
      nombre_commandes: nombreCommandes,
      commentaires: salesData.commentaires || null,
      marge_brute: margeBrute,
      taux_marge: tauxMarge,
      panier_moyen: panierMoyen,
      montant: chiffreAffaires, // Le montant est égal au chiffre d'affaires
      date: new Date(), // Date actuelle
      user: { id: user.id }
    });

    const createdId = result.identifiers[0].id;
    const newSale = await this.salesRepository.findOne({ where: { id: createdId } });

    // Créer automatiquement le droit d'entrée si c'est la première vente
    const allSales = await this.findAllByUser(user);
    if (allSales.length === 1) {
      await this.paymentService.createDroitEntree(user);
    }

    // Calculer et créer les commissions/achats obligatoires
    await this.paymentService.calculateCommissions(user, allSales);
    await this.paymentService.calculateAchatObligatoire(user, allSales);

    return newSale;
  }

  async update(id: number, salesData: any, user: User) {
    const existingSales = await this.findById(id, user);
    if (!existingSales) {
      throw new Error('Vente non trouvée');
    }

    const chiffreAffaires = salesData.chiffre_affaires !== undefined ? Number(salesData.chiffre_affaires) : existingSales.chiffre_affaires;
    const coutsOperationnels = salesData.couts_operationnels !== undefined ? Number(salesData.couts_operationnels) : existingSales.couts_operationnels;
    const nombreCommandes = salesData.nombre_commandes !== undefined ? Number(salesData.nombre_commandes) : existingSales.nombre_commandes;
    
    const margeBrute = chiffreAffaires - coutsOperationnels;
    const tauxMarge = chiffreAffaires > 0 ? (margeBrute / chiffreAffaires) * 100 : 0;
    const panierMoyen = nombreCommandes > 0 ? chiffreAffaires / nombreCommandes : 0;

    await this.salesRepository.update(
      { id },
      {
        periode: salesData.periode || existingSales.periode,
        chiffre_affaires: chiffreAffaires,
        couts_operationnels: coutsOperationnels,
        nombre_commandes: nombreCommandes,
        commentaires: salesData.commentaires || existingSales.commentaires,
        marge_brute: margeBrute,
        taux_marge: tauxMarge,
        panier_moyen: panierMoyen
      }
    );

    return this.findById(id, user);
  }

  async remove(id: number, user: User) {
    const existingSales = await this.findById(id, user);
    if (!existingSales) {
      throw new Error('Vente non trouvée');
    }
    
    const result = await this.salesRepository.delete({ id });
    if (result.affected === 0) {
      throw new Error('Erreur lors de la suppression');
    }
    return { message: 'Vente supprimée avec succès' };
  }

  async getStatsByUser(user: User) {
    const sales = await this.findAllByUser(user);
    
    const totalCA = sales.reduce((sum, s) => sum + Number(s.chiffre_affaires), 0);
    const totalMarge = sales.reduce((sum, s) => sum + Number(s.marge_brute), 0);
    const totalCommandes = sales.reduce((sum, s) => sum + s.nombre_commandes, 0);
    const moyenneCommandes = sales.length > 0 ? totalCommandes / sales.length : 0;
    const panierMoyen = totalCommandes > 0 ? totalCA / totalCommandes : 0;
    
    // Calculs selon les conditions du sujet
    const droitEntree = 50000; // 50 000 € de droit d'entrée
    const commission = totalCA * 0.04; // 4% du CA
    const achatObligatoire = totalCA * 0.8; // 80% du CA pour achats obligatoires
    const achatLibre = totalCA * 0.2; // 20% du CA pour achats libres
    
    return {
      totalCA,
      totalMarge,
      moyenneCommandes,
      panierMoyen,
      // Conditions financières Driv'n Cook
      droitEntree,
      commission,
      achatObligatoire,
      achatLibre,
      beneficeNet: totalMarge - commission
    };
  }

  async generateReport(user: User) {
    const sales = await this.findAllByUser(user);
    const stats = await this.getStatsByUser(user);
    
    // Créer le dossier reports s'il n'existe pas
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Générer le PDF
    const pdfFilename = `rapport-ventes-${user.nom}-${Date.now()}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFilename);
    
    const pdfContent = this.generatePDF(sales, stats, user);
    fs.writeFileSync(pdfPath, pdfContent);

    return {
      filename: pdfFilename,
      filepath: pdfPath,
      message: 'Rapport PDF généré avec succès'
    };
  }

  private generatePDF(sales: Sales[], stats: any, user: User): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const userName = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Franchise';
    
    // PDF ultra-simple sans aucun formatage spécial
    let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 1500
>>
stream
BT
/F1 16 Tf
72 750 Td
(Drivn Cook - Rapport de ventes) Tj
0 -30 Td
/F1 12 Tf
(Franchise: ${userName}) Tj
0 -20 Td
(Date: ${currentDate}) Tj
0 -40 Td
/F1 14 Tf
(Resume des performances) Tj
0 -25 Td
/F1 10 Tf
(Chiffre d'affaires total: ${stats.totalCA} EUR) Tj
0 -15 Td
(Marge totale: ${stats.totalMarge} EUR) Tj
0 -15 Td
(Moyenne commandes: ${stats.moyenneCommandes.toFixed(0)}) Tj
0 -15 Td
(Panier moyen: ${stats.panierMoyen.toFixed(2)} EUR) Tj
0 -30 Td
/F1 14 Tf
(Detail des ventes) Tj
0 -20 Td
/F1 10 Tf
`;

    if (sales.length === 0) {
      pdfContent += `(Aucune periode de vente enregistree) Tj
`;
    } else {
      sales.forEach((sale, index) => {
        pdfContent += `(${sale.periode}: ${Number(sale.chiffre_affaires)} EUR - ${sale.nombre_commandes} commandes) Tj
`;
        if (index < sales.length - 1) {
          pdfContent += `0 -12 Td
`;
        }
      });
    }

    pdfContent += `
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${pdfContent.length}
%%EOF`;

    return pdfContent;
  }
} 