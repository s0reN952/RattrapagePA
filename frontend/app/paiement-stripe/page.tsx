'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaiementStripePage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentIntent, setPaymentIntent] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const intent = searchParams.get('payment_intent');
    const secret = searchParams.get('client_secret');
    
    if (!intent || !secret) {
      setError('Paramètres de paiement manquants');
      setLoading(false);
      return;
    }

    setPaymentIntent(intent);
    setClientSecret(secret);
    setLoading(false);
  }, [searchParams]);

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Simuler un paiement réussi (en production, vous utiliseriez le vrai SDK Stripe)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Confirmer le paiement côté serveur
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/payments/stripe/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentIntentId: paymentIntent })
      });

      if (response.ok) {
        // Rediriger vers la page de succès
        router.push('/paiement-succes');
      } else {
        setError('Erreur lors de la confirmation du paiement');
      }
    } catch (error) {
      setError('Erreur lors du traitement du paiement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du formulaire de paiement...</p>
        </div>
      </div>
    );
  }

  if (error && !processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Erreur</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/droit-entree')}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retour au droit d'entrée
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Paiement sécurisé</h1>
          <p className="text-lg text-gray-600">
            Finalisez votre paiement du droit d'entrée
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Droit d'entrée Driv'n Cook</h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Montant :</span>
                  <span className="text-2xl font-bold text-blue-600">50 000,00 €</span>
                </div>
                <p className="text-sm text-gray-500">
                  Paiement sécurisé via Stripe
                </p>
              </div>
            </div>

            {/* Formulaire de paiement simulé */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={processing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={processing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du titulaire
                </label>
                <input
                  type="text"
                  placeholder="Jean Dupont"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={processing}
                />
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-6"
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Traitement en cours...
                </div>
              ) : (
                'Payer 50 000,00 €'
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Vos informations de paiement sont sécurisées et cryptées.
            </p>
          </div>
        </div>

        {/* Informations de sécurité */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Paiement sécurisé
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              Données cryptées
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 