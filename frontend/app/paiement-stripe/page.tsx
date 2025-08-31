'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PaiementStripeContent() {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/payments/stripe/confirm`, {
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
          <h1 className="text-3xl font-bold text-gray-900">Paiement Stripe</h1>
          <p className="mt-2 text-gray-600">Confirmez votre paiement</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Détails du paiement</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Payment Intent:</span> {paymentIntent}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Client Secret:</span> {clientSecret.substring(0, 20)}...
              </p>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Traitement en cours...
              </div>
            ) : (
              'Confirmer le paiement'
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/droit-entree')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Annuler et retourner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaiementStripePageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PaiementStripeContent />
    </Suspense>
  );

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PaiementStripePageContent />
    </Suspense>
  );
}

export default function PaiementStripePage() {

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PaiementStripePageContent />
    </Suspense>
  );
}