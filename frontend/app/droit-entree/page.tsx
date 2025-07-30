'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentStatus {
  exists: boolean;
  paid: boolean;
  payment: any;
}

export default function DroitEntreePage() {
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/payments/droit-entree/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        console.log('📊 Statut reçu du backend:', status);
        setPaymentStatus(status);
      } else {
        console.error('❌ Erreur lors de la récupération du statut:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/payments/droit-entree', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const payment = await response.json();
        if (payment.stripe_url) {
          window.location.href = payment.stripe_url;
        } else {
          alert('URL de paiement Stripe manquante');
        }
      } else {
        const errorData = await response.json();
        
        // Si le backend dit que le droit d'entrée est déjà payé, afficher le message de succès
        if (errorData.message && errorData.message.includes('déjà été payé')) {
          console.log('✅ Backend confirme que le droit d\'entrée est déjà payé');
          setPaymentStatus({
            exists: true,
            paid: true,
            payment: { statut: 'paye' }
          });
          return;
        }
        
        alert(errorData.message || 'Erreur lors de la création du paiement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si le droit d'entrée est déjà payé, afficher un message de succès
  if (paymentStatus?.paid) {
    console.log('✅ Affichage du message "déjà payé"');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Droit d'entrée payé !</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Votre droit d'entrée de 50 000€ a été payé avec succès.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Accéder au dashboard
              </button>
              
              <button
                onClick={() => router.push('/trucks')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Gérer mes camions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('❌ Affichage du formulaire de paiement. Statut:', paymentStatus);

  // Vérification manuelle - si le paiement existe mais n'est pas détecté comme payé
  if (paymentStatus?.exists && !paymentStatus?.paid && paymentStatus?.payment?.statut === 'paye') {
    console.log('🔧 Correction manuelle du statut payé');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Droit d'entrée payé !</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Votre droit d'entrée de 50 000€ a été payé avec succès.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Accéder au dashboard
              </button>
              
              <button
                onClick={() => router.push('/trucks')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Gérer mes camions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Droit d'entrée Driv'n Cook</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50 000 €</div>
              <p className="text-gray-600">Droit d'entrée pour devenir franchisé</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Camion équipé</span>
              <span className="text-green-600">✓ Inclus</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Formation complète</span>
              <span className="text-green-600">✓ Inclus</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Support technique</span>
              <span className="text-green-600">✓ Inclus</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Marketing</span>
              <span className="text-green-600">✓ Inclus</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Préparation du paiement...
              </div>
            ) : (
              'Payer 50 000 €'
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Paiement sécurisé via Stripe
          </p>
        </div>
      </div>
    </div>
  );
} 