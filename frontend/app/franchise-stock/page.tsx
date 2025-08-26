"use client";
import { useState, useEffect } from 'react';

interface FranchiseStockItem {
  id: number;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  notes: string;
  dateExpiration: string | null;
  isExpired: boolean;
  product: {
    id: number;
    nom: string;
    prix: number;
    stock: number;
    category: string;
  };
}

export default function FranchiseStockPage() {
  const [stockItems, setStockItems] = useState<FranchiseStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProduits: 0,
    totalArticles: 0,
    produitsExpiration: 0,
    valeurTotale: 0
  });

  useEffect(() => {
    fetchMyStock();
  }, []);

  const fetchMyStock = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/warehouses/my-stock', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStockItems(data);
        
        // Calculer les statistiques
        const totalArticles = data.reduce((sum: number, item: FranchiseStockItem) => sum + item.quantite, 0);
        const valeurTotale = data.reduce((sum: number, item: FranchiseStockItem) => sum + item.prixTotal, 0);
        const produitsExpiration = data.filter((item: FranchiseStockItem) => 
          item.dateExpiration && isExpiringSoon(item.dateExpiration)
        ).length;
        
        setStats({
          totalProduits: data.length,
          totalArticles,
          produitsExpiration,
          valeurTotale
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'nourriture': '🍽️ Nourriture',
      'boisson': '🥤 Boisson',
      'dessert': '🍰 Dessert',
      'ingredient': '🥕 Ingrédient',
      'plat_prepare': '🍳 Plat préparé'
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const isExpiringSoon = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const getStatusColor = (item: FranchiseStockItem) => {
    if (item.isExpired) return 'bg-red-50 border-red-300';
    if (item.dateExpiration && isExpiringSoon(item.dateExpiration)) return 'bg-yellow-50 border-yellow-300';
    return 'bg-white border-gray-200 hover:border-blue-300 transition-all duration-200';
  };

  const getStatusLabel = (item: FranchiseStockItem) => {
    if (item.isExpired) return '❌ Expiré';
    if (item.dateExpiration && isExpiringSoon(item.dateExpiration)) return '⚠️ Expire bientôt';
    return '✅ Bon état';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Chargement de votre stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <span className="text-4xl">📦</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Mon Stock Personnel
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gérez votre inventaire et suivez vos produits en temps réel
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200 border-l-4 border-blue-500">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalProduits}</div>
            <div className="text-blue-800 font-medium">Produits différents</div>
            <div className="text-blue-400 text-sm mt-1">📊</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200 border-l-4 border-green-500">
            <div className="text-4xl font-bold text-green-600 mb-2">{stats.totalArticles}</div>
            <div className="text-green-800 font-medium">Articles au total</div>
            <div className="text-green-400 text-sm mt-1">📦</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200 border-l-4 border-yellow-500">
            <div className="text-4xl font-bold text-yellow-600 mb-2">{stats.produitsExpiration}</div>
            <div className="text-yellow-800 font-medium">Expirent bientôt</div>
            <div className="text-yellow-400 text-sm mt-1">⏰</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200 border-l-4 border-purple-500">
            <div className="text-4xl font-bold text-purple-600 mb-2">{stats.valeurTotale.toFixed(2)}€</div>
            <div className="text-purple-800 font-medium">Valeur totale</div>
            <div className="text-purple-400 text-sm mt-1">💰</div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            Actions rapides
          </h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="/warehouses"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              🏭 Voir les entrepôts
            </a>
            <a
              href="/warehouses/stock-management"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              🛒 Acheter du stock
            </a>
          </div>
        </div>

        {/* Stock personnel */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-8 flex items-center">
            <span className="text-3xl mr-3">📋</span>
            Détail de mon stock
          </h3>
          
          {stockItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-8xl mb-6">📦</div>
              <p className="text-2xl mb-3 font-medium">Votre stock personnel est vide</p>
              <p className="text-gray-600 mb-8 text-lg">
                Achetez des produits dans nos entrepôts pour commencer à gérer votre inventaire !
              </p>
              <a
                href="/warehouses/stock-management"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                🛒 Acheter du stock
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {stockItems.map((item) => (
                <div key={item.id} className={`p-6 rounded-xl border-2 ${getStatusColor(item)} shadow-md hover:shadow-lg transition-all duration-200`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-xl font-bold text-gray-900">{item.product.nom}</h4>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {getCategoryLabel(item.product.category)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Quantité</div>
                          <div className="text-xl font-bold text-gray-900">{item.quantite}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Prix unitaire</div>
                          <div className="text-xl font-bold text-gray-900">{item.prixUnitaire}€</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Valeur totale</div>
                          <div className="text-xl font-bold text-gray-900">{item.prixTotal}€</div>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">📝 Notes:</span> {item.notes}
                          </p>
                        </div>
                      )}
                      
                      {item.dateExpiration && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">📅 Date d'expiration:</span> {formatDate(item.dateExpiration)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        item.isExpired ? 'bg-red-100 text-red-800 border border-red-200' :
                        item.dateExpiration && isExpiringSoon(item.dateExpiration) ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {getStatusLabel(item)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
