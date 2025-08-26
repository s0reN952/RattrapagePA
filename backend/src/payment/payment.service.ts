import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { User } from '../user/user.entity';
import { Sales } from '../sales/sales.entity';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private stripeService: StripeService,
  ) {}

  findAllByUser(user: User) {
    return this.paymentRepository.find({ 
      where: { user: { id: user.id } },
      order: { date_creation: 'DESC' }
    });
  }

  findById(id: number, user: User) {
    return this.paymentRepository.findOne({ 
      where: { id, user: { id: user.id } }
    });
  }

  async createDroitEntree(user: User) {
    try {
      console.log('🚀 Début création droit d\'entrée pour utilisateur:', user.id);
      
      // Vérifier que l'utilisateur a un ID valide
      if (!user || !user.id) {
        throw new Error('Utilisateur invalide');
      }

      // Vérifier s'il existe déjà un paiement (payé ou en attente)
      const existingPayment = await this.paymentRepository.findOne({
        where: {
          user: { id: user.id },
          type: 'droit_entree'
        }
      });

      if (existingPayment) {
        if (existingPayment.statut === 'paye') {
          throw new Error('Le droit d\'entrée a déjà été payé');
        } else if (existingPayment.statut === 'en_attente') {
          // Si le paiement est en attente, retourner l'URL existante
          console.log('✅ Paiement en attente trouvé, retour de l\'URL existante');
          
          return {
            id: existingPayment.id,
            type: 'droit_entree',
            montant: existingPayment.montant,
            description: existingPayment.description,
            statut: 'en_attente',
            stripe_session_id: existingPayment.stripe_payment_intent_id,
            stripe_url: `https://checkout.stripe.com/c/pay/${existingPayment.stripe_payment_intent_id}`
          };
        }
      }

      console.log('✅ Utilisateur valide, création session Stripe...');

      // Créer une session Stripe Checkout
      const session = await this.stripeService.createCheckoutSession(50000, 'eur', user.id, user.email);
      
      console.log('✅ Session Stripe créée, enregistrement en base...');
      
      // Enregistrer le paiement en attente
      const result = await this.paymentRepository.insert({
        type: 'droit_entree',
        montant: 50000,
        description: 'Droit d\'entrée Driv\'n Cook',
        statut: 'en_attente',
        user: { id: user.id },
        stripe_payment_intent_id: session.id,
        stripe_client_secret: session.id, // Stocker l'ID de session au lieu de l'URL
        stripe_status: 'open'
      });

      console.log('✅ Paiement enregistré en base, ID:', result.identifiers[0].id);

      return {
        id: result.identifiers[0].id,
        type: 'droit_entree',
        montant: 50000,
        description: 'Droit d\'entrée Driv\'n Cook',
        statut: 'en_attente',
        stripe_session_id: session.id,
        stripe_url: session.url // Retourner l'URL complète pour le frontend
      };
    } catch (error) {
      console.error('❌ Erreur dans createDroitEntree:', error);
      throw new Error(`Erreur lors de la création du droit d'entrée: ${error.message}`);
    }
  }

  async processStripePayment(sessionId: string, user: User) {
    try {
      console.log('🔍 Confirmation de session Stripe:', sessionId);
      
      const payment = await this.paymentRepository.findOne({
        where: {
          stripe_payment_intent_id: sessionId,
          user: { id: user.id }
        }
      });

      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      // Récupérer le statut de la session Stripe
      const session = await this.stripeService.getSessionStatus(sessionId);
      
      if (session.status === 'complete') {
        // Mettre à jour le statut du paiement
        await this.paymentRepository.update(payment.id, {
          statut: 'paye',
          date_paiement: new Date(),
          stripe_status: session.status
        });

        console.log('✅ Paiement confirmé avec succès');
        return { success: true, message: 'Paiement confirmé avec succès' };
      } else {
        console.log('⚠️ Session non complète:', session.status);
        return { success: false, message: 'Paiement en cours' };
      }
    } catch (error) {
      console.error('❌ Erreur lors de la confirmation du paiement:', error);
      throw new Error(`Erreur lors de la confirmation du paiement: ${error.message}`);
    }
  }

  async handleStripeWebhook(body: any, signature: string) {
    try {
      // Vérifier la signature du webhook (en production)
      // const event = this.stripeService.verifyWebhookSignature(body, signature);
      
      // Pour le développement, on traite directement le body
      const event = body;
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Trouver le paiement correspondant
        const payment = await this.paymentRepository.findOne({
          where: {
            stripe_payment_intent_id: session.id,
            type: 'droit_entree'
          }
        });

        if (payment) {
          // Mettre à jour le statut du paiement
          await this.paymentRepository.update(payment.id, {
            statut: 'paye',
            date_paiement: new Date(),
            stripe_status: session.status
          });
        }
      }

      return { received: true };
    } catch (error) {
      throw new Error(`Erreur lors du traitement du webhook: ${error.message}`);
    }
  }

  async checkDroitEntreePaid(user: User): Promise<boolean> {
    const droitEntree = await this.paymentRepository.findOne({
      where: { 
        user: { id: user.id }, 
        type: 'droit_entree',
        statut: 'paye'
      }
    });

    return !!droitEntree;
  }

  async getDroitEntreeStatus(user: User) {
    console.log('🔍 Vérification statut droit d\'entrée pour utilisateur:', user.id);
    
    // Chercher d'abord un paiement payé
    const paidPayment = await this.paymentRepository.findOne({
      where: { 
        user: { id: user.id }, 
        type: 'droit_entree',
        statut: 'paye'
      }
    });

    if (paidPayment) {
      console.log('✅ Paiement payé trouvé:', paidPayment.id);
      return {
        exists: true,
        paid: true,
        payment: paidPayment
      };
    }

    // Si pas de paiement payé, chercher un paiement en attente
    const pendingPayment = await this.paymentRepository.findOne({
      where: { 
        user: { id: user.id }, 
        type: 'droit_entree',
        statut: 'en_attente'
      }
    });

    if (pendingPayment) {
      console.log('📊 Paiement en attente trouvé:', pendingPayment.id);
      return {
        exists: true,
        paid: false,
        payment: pendingPayment
      };
    }

    console.log('❌ Aucun paiement trouvé');
    return {
      exists: false,
      paid: false,
      payment: null
    };
  }

  async calculateCommissions(user: User, sales: Sales[]) {
    const totalCA = sales.reduce((sum, s) => sum + Number(s.chiffre_affaires), 0);
    const commissionAmount = totalCA * 0.04; // 4% du CA

    if (commissionAmount > 0) {
      // Vérifier si une commission existe déjà pour cette période
      const existingCommission = await this.paymentRepository.findOne({
        where: { 
          user: { id: user.id }, 
          type: 'commission',
          description: `Commission 4% - CA: ${totalCA} EUR`
        }
      });

      if (!existingCommission) {
        await this.paymentRepository.insert({
          type: 'commission',
          montant: commissionAmount,
          description: `Commission 4% - CA: ${totalCA} EUR`,
          statut: 'en_attente',
          user: { id: user.id }
        });
      }
    }

    return commissionAmount;
  }

  async calculateAchatObligatoire(user: User, sales: Sales[]) {
    const totalCA = sales.reduce((sum, s) => sum + Number(s.chiffre_affaires), 0);
    const achatObligatoire = totalCA * 0.8; // 80% du CA

    if (achatObligatoire > 0) {
      // Vérifier si un achat obligatoire existe déjà pour cette période
      const existingAchat = await this.paymentRepository.findOne({
        where: { 
          user: { id: user.id }, 
          type: 'achat_obligatoire',
          description: `Achat obligatoire 80% - CA: ${totalCA} EUR`
        }
      });

      if (!existingAchat) {
        await this.paymentRepository.insert({
          type: 'achat_obligatoire',
          montant: achatObligatoire,
          description: `Achat obligatoire 80% - CA: ${totalCA} EUR`,
          statut: 'en_attente',
          user: { id: user.id }
        });
      }
    }

    return achatObligatoire;
  }

  async getFinancialSummary(user: User) {
    const payments = await this.findAllByUser(user);
    
    const droitEntree = payments.filter(p => p.type === 'droit_entree').reduce((sum, p) => sum + Number(p.montant), 0);
    const totalCommissions = payments.filter(p => p.type === 'commission').reduce((sum, p) => sum + Number(p.montant), 0);
    const totalAchatsObligatoires = payments.filter(p => p.type === 'achat_obligatoire').reduce((sum, p) => sum + Number(p.montant), 0);
    const paiementsPayes = payments.filter(p => p.statut === 'paye').reduce((sum, p) => sum + Number(p.montant), 0);
    const paiementsEnAttente = payments.filter(p => p.statut === 'en_attente').reduce((sum, p) => sum + Number(p.montant), 0);

    return {
      droitEntree,
      totalCommissions,
      totalAchatsObligatoires,
      paiementsPayes,
      paiementsEnAttente,
      totalObligations: droitEntree + totalCommissions + totalAchatsObligatoires
    };
  }

  async markAsPaid(id: number, user: User) {
    const payment = await this.paymentRepository.findOne({
      where: { id, user: { id: user.id } }
    });

    if (!payment) {
      throw new Error('Paiement non trouvé');
    }

    await this.paymentRepository.update(id, {
      statut: 'paye',
      date_paiement: new Date()
    });

    return { success: true, message: 'Paiement marqué comme payé' };
  }

  async markDroitEntreeAsPaid(user: User) {
    const payment = await this.paymentRepository.findOne({
      where: { 
        user: { id: user.id }, 
        type: 'droit_entree'
      }
    });

    if (!payment) {
      throw new Error('Aucun paiement de droit d\'entrée trouvé');
    }

    await this.paymentRepository.update(payment.id, {
      statut: 'paye',
      date_paiement: new Date()
    });

    console.log('✅ Droit d\'entrée marqué comme payé pour utilisateur:', user.id);
    return { success: true, message: 'Droit d\'entrée marqué comme payé' };
  }

  async checkDroitEntreeStatus(user: User) {
    const status = await this.getDroitEntreeStatus(user);
    
    console.log('🔍 Statut détaillé du droit d\'entrée:', {
      exists: status.exists,
      paid: status.paid,
      statut: status.payment?.statut,
      date_paiement: status.payment?.date_paiement
    });
    
    return status;
  }

  async syncStripePaymentStatus(user: User) {
    console.log('🔄 Synchronisation du statut Stripe pour utilisateur:', user.id);
    
    const payment = await this.paymentRepository.findOne({
      where: { 
        user: { id: user.id }, 
        type: 'droit_entree'
      }
    });

    if (!payment) {
      console.log('❌ Aucun paiement trouvé');
      return { success: false, message: 'Aucun paiement trouvé' };
    }

    if (payment.statut === 'paye') {
      console.log('✅ Paiement déjà marqué comme payé');
      return { success: true, message: 'Paiement déjà payé' };
    }

    if (!payment.stripe_payment_intent_id) {
      console.log('❌ Pas d\'ID de session Stripe');
      return { success: false, message: 'Pas d\'ID de session Stripe' };
    }

    try {
      // Vérifier le statut de la session Stripe
      const session = await this.stripeService.getSessionStatus(payment.stripe_payment_intent_id);
      console.log('📊 Statut de la session Stripe:', session.status);

      if (session.status === 'complete') {
        // Mettre à jour le statut dans la base de données
        await this.paymentRepository.update(payment.id, {
          statut: 'paye',
          date_paiement: new Date(),
          stripe_status: session.status
        });

        console.log('✅ Paiement marqué comme payé après vérification Stripe');
        return { success: true, message: 'Paiement confirmé et marqué comme payé' };
      } else {
        console.log('⚠️ Session Stripe non complète:', session.status);
        return { success: false, message: 'Paiement en cours ou non complété' };
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification Stripe:', error);
      return { success: false, message: 'Erreur lors de la vérification du paiement' };
    }
  }
}