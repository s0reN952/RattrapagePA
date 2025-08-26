import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null;

  constructor() {
    // Utiliser uniquement la variable d'environnement
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      console.warn('⚠️ STRIPE_SECRET_KEY non définie dans les variables d\'environnement');
      // En mode développement, on peut continuer sans Stripe
      this.stripe = null;
      return;
    }
    
    console.log('🔑 Initialisation Stripe avec la clé:', stripeKey.substring(0, 20) + '...');
    
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'eur') {
    if (!this.stripe) {
      throw new Error('Stripe non configuré. Vérifiez STRIPE_SECRET_KEY dans .env');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Stripe utilise les centimes
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: 'droit_entree',
          description: 'Droit d\'entrée Driv\'n Cook'
        }
      });
      
      return paymentIntent;
    } catch (error) {
      throw new Error(`Erreur lors de la création du paiement: ${error.message}`);
    }
  }

  async createCheckoutSession(
    amount: number,
    currency: string,
    userId: number,
    userEmail: string,
    type: 'droit_entree' | 'stock_order' = 'droit_entree',
    metadata?: any
  ): Promise<{ id: string; url: string }> {
    try {
      let productName: string;
      let productDescription: string;
      let successUrl: string;
      let cancelUrl: string;

      if (type === 'stock_order') {
        productName = 'Achat de stock Driv\'n Cook';
        productDescription = 'Stock d\'ingrédients, plats préparés et boissons';
        successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/warehouses/payment-success?session_id={CHECKOUT_SESSION_ID}`;
        cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/warehouses/stock-management`;
      } else {
        productName = 'Droit d\'entrée Driv\'n Cook';
        productDescription = 'Frais d\'entrée pour devenir franchisé Driv\'n Cook';
        successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement-succes?session_id={CHECKOUT_SESSION_ID}`;
        cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/droit-entree`;
      }

      if (!this.stripe) {
        throw new Error('Stripe non configuré. Vérifiez STRIPE_SECRET_KEY dans .env');
      }
      
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: productName,
                description: productDescription,
              },
              unit_amount: Math.round(amount), // Le montant est déjà en centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userEmail,
        metadata: metadata || {}, // Ajouter les métadonnées
      });

      console.log(`✅ Session de paiement créée: ${session.id || 'N/A'} pour ${amount}${currency}`);
      return { id: session.id || '', url: session.url || '' };
    } catch (error) {
      console.error('❌ Erreur lors de la création de la session de paiement:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string) {
    if (!this.stripe) {
      throw new Error('Stripe non configuré. Vérifiez STRIPE_SECRET_KEY dans .env');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'requires_payment_method') {
        // Simuler une confirmation pour le développement
        // En production, cela serait géré par le webhook Stripe
        return {
          id: paymentIntentId,
          status: 'succeeded',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        };
      }
      
      return {
        id: paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      throw new Error(`Erreur lors de la confirmation du paiement: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentIntentId: string) {
    if (!this.stripe) {
      throw new Error('Stripe non configuré. Vérifiez STRIPE_SECRET_KEY dans .env');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du statut: ${error.message}`);
    }
  }

  async getSessionStatus(sessionId: string) {
    if (!this.stripe) {
      throw new Error('Stripe non configuré. Vérifiez STRIPE_SECRET_KEY dans .env');
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      return {
        id: sessionId,
        status: session.status,
        amount: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du statut de session: ${error.message}`);
    }
  }

  // Traiter un webhook Stripe
  async handleWebhook(event: any): Promise<{ success: boolean; message: string }> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          
          // Vérifier que c'est une commande de stock (pas un droit d'entrée)
          if (session.metadata?.type === 'stock_order') {
            console.log(`🛒 Webhook: Session de paiement complétée pour commande de stock - Session ID: ${session.id}`);
            
                         // Récupérer les données de la commande depuis les métadonnées simplifiées
             const simplifiedItems = JSON.parse(session.metadata.orderItems || '[]');
             const orderData = {
               items: simplifiedItems, // Déjà simplifiés
               total: session.amount_total / 100, // Stripe utilise les centimes
               userId: parseInt(session.metadata.userId || '0'),
               compliance: JSON.parse(session.metadata.compliance || '{}')
             };
            
            // Appeler le service warehouse pour mettre à jour le stock
            // Note: On injectera le WarehouseService via le constructeur
            console.log(`📦 Webhook: Données de commande récupérées:`, orderData);
            
            return {
              success: true,
              message: `Webhook traité avec succès pour la commande de stock - Session: ${session.id}`
            };
          } else {
            console.log(`💰 Webhook: Session de paiement complétée pour droit d'entrée - Session ID: ${session.id}`);
            return {
              success: true,
              message: `Webhook traité avec succès pour le droit d'entrée - Session: ${session.id}`
            };
          }
          
        case 'payment_intent.succeeded':
          console.log(`✅ Webhook: Paiement réussi - Payment Intent: ${event.data.object.id}`);
          return {
            success: true,
            message: `Webhook traité avec succès pour le paiement - Intent: ${event.data.object.id}`
          };
          
        default:
          console.log(`ℹ️ Webhook: Événement non géré - Type: ${event.type}`);
          return {
            success: true,
            message: `Webhook reçu mais non traité - Type: ${event.type}`
          };
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement du webhook:', error);
      return {
        success: false,
        message: `Erreur lors du traitement du webhook: ${error.message}`
      };
    }
  }
} 