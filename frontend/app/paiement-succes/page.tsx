"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaiementSuccesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (sessionId) {
      // Vérifier le statut du paiement
      checkPaymentStatus(sessionId);
    } else {
      setStatus('error');
      setMessage('Session ID manquant');
    }
  }, [sessionId]);

  const checkPaymentStatus = async (sessionId: string) => {
    try {
      const response = await fetch('/api/warehouses/payment/session-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatus('success');
          setMessage('Paiement confirmé ! Votre stock a été ajouté avec succès.');
          // Rediriger vers le stock après 3 secondes
          setTimeout(() => {
            router.push('/franchise-stock');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Erreur lors de la confirmation du paiement');
        }
      } else {
        setStatus('error');
        setMessage('Erreur lors de la vérification du statut');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur de connexion');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          {status === 'success' ? (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Paiement réussi !
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 Félicitations !
                </h3>
                <p className="text-green-700">
                  Votre achat de stock a été confirmé et ajouté à votre inventaire personnel.
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Redirection automatique vers votre stock dans 3 secondes...
              </p>
              <button
                onClick={() => router.push('/franchise-stock')}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir mon stock maintenant
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-3xl font-bold text-red-900 mb-4">
                Erreur de paiement
              </h1>
              <p className="text-lg text-red-600 mb-6">
                {message}
              </p>
              <button
                onClick={() => router.push('/warehouses/stock-management')}
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retourner à la gestion des achats
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 