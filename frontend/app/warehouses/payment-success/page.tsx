"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function WarehousePaymentSuccessContent() {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [stockProcessing, setStockProcessing] = useState(false);
  const [stockProcessed, setStockProcessed] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Récupérer les détails de la commande
      fetchOrderDetails(sessionId);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/warehouses/payment/session-status?sessionId=${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
        
        // Traiter automatiquement le stock après récupération des détails
        if (data && data.status === 'complete') {
          processStockAfterPayment(sessionId);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const processStockAfterPayment = async (sessionId: string) => {
    setStockProcessing(true);
    setStockError(null);
    
    try {
      // Récupérer les données de la commande depuis le localStorage
      const orderData = localStorage.getItem('lastOrderData');
      
      if (!orderData) {
        throw new Error('Données de commande non trouvées');
      }
      
      const parsedOrderData = JSON.parse(orderData);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/warehouses/payment/process-stock', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedOrderData),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Stock traité avec succès:', result);
        setStockProcessed(true);
        
        // Nettoyer les données temporaires
        localStorage.removeItem('lastOrderData');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du traitement du stock');
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement du stock:', error);
      setStockError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setStockProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* En-tête de succès */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
              <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎉 Paiement réussi !
            </h1>
            <p className="text-lg text-gray-600">
              Votre commande de stock a été validée et payée avec succès
            </p>
          </div>

          {/* Statut du traitement du stock */}
          {stockProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">📦 Traitement du stock en cours...</h3>
                  <p className="text-blue-800">Votre stock personnel est en cours de mise à jour</p>
                </div>
              </div>
            </div>
          )}

          {stockProcessed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-bold text-green-900">✅ Stock mis à jour avec succès !</h3>
                  <p className="text-green-800">Votre stock personnel a été mis à jour. Vous pouvez maintenant le consulter dans "Mon Stock".</p>
                </div>
              </div>
            </div>
          )}

          {stockError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-bold text-red-900">❌ Erreur lors de la mise à jour du stock</h3>
                  <p className="text-red-800">{stockError}</p>
                  <button
                    onClick={() => processStockAfterPayment(searchParams.get('session_id') || '')}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                  >
                    🔄 Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Détails de la commande */}
          {orderDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Détails de la commande</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Numéro de commande :</span>
                  <span className="font-medium">{orderDetails.sessionId || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Montant total :</span>
                  <span className="text-xl font-bold text-green-600">
                    {orderDetails.amount ? (orderDetails.amount / 100).toFixed(2) : 'N/A'}€
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Statut :</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    ✅ Payé
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Conformité 80/20 :</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    🏭 Respectée
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Informations importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">📦 Prochaines étapes</h3>
            <ul className="space-y-2 text-blue-800">
              {stockProcessed ? (
                <>
                  <li>✅ Votre stock personnel a été mis à jour</li>
                  <li>• Consultez votre stock dans l'onglet "Mon Stock"</li>
                  <li>• Vos produits sont maintenant disponibles</li>
                  <li>• Les dates d'expiration ont été calculées automatiquement</li>
                </>
              ) : (
                <>
                  <li>• Votre commande sera traitée dans les 24h</li>
                  <li>• Vous recevrez un email de confirmation</li>
                  <li>• Les produits seront livrés à votre entrepôt de référence</li>
                  <li>• Votre stock sera mis à jour automatiquement</li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            {stockProcessed ? (
              <button
                onClick={() => router.push('/warehouses')}
                className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
              >
                📦 Voir mon stock
              </button>
            ) : (
              <button
                onClick={() => router.push('/warehouses/stock-management')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                🛒 Continuer les achats
              </button>
            )}
            
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
            >
              🏠 Retour au dashboard
            </button>
          </div>

          {/* Informations de contact */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Des questions ? Contactez notre équipe support :</p>
            <p className="mt-1">
              📧 support@drivncook.fr | 📞 01 23 45 67 89
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WarehousePaymentSuccessPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <WarehousePaymentSuccessContent />
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
      <WarehousePaymentSuccessPageContent />
    </Suspense>
  );
}

export default function WarehousePaymentSuccessPage() {

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <WarehousePaymentSuccessPageContent />
    </Suspense>
  );
}