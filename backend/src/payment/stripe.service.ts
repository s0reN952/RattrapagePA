import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    // Utiliser la clé Stripe fournie
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51RYn0F2VQ6c0F2Q64FUeP7qLEMCn8iklRhLUd1QsR5o8X0wTF67VsjTSDSyQJHc1GBbg0Gpnc35jbjmbeBYDeKZH00TqvHgdm4';
    
    console.log('🔑 Initialisation Stripe avec la clé:', stripeKey.substring(0, 20) + '...');
    
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'eur') {
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

  async createCheckoutSession(amount: number, currency: string = 'eur', userId?: number, userEmail?: string) {
    try {
      console.log('🔧 Création session Stripe:', { amount, currency, userId, userEmail });
      
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: 'Droit d\'entrée Driv\'n Cook',
                description: 'Droit d\'entrée pour devenir franchisé Driv\'n Cook',
              },
              unit_amount: amount * 100, // Stripe utilise les centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement-succes?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/droit-entree`,
        customer_email: userEmail, // Pré-remplir l'email
        metadata: {
          type: 'droit_entree',
          user_id: userId ? userId.toString() : 'unknown',
          description: 'Droit d\'entrée Driv\'n Cook'
        }
      });
      
      console.log('✅ Session Stripe créée:', session.id);
      return session;
    } catch (error) {
      console.error('❌ Erreur création session Stripe:', error);
      
      // Fallback : simuler une session Stripe pour le développement
      console.log('🔄 Utilisation du mode fallback (simulation)');
      return {
        id: `cs_test_${Date.now()}`,
        url: 'http://localhost:3000/paiement-stripe?payment_intent=pi_test&client_secret=pi_test_secret',
        status: 'open'
      };
    }
  }

  async confirmPayment(paymentIntentId: string) {
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
} 