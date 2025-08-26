"use client";
import { useState, useEffect } from 'react';

interface Warehouse {
  id: number;
  nom: string;
  adresse: string;
  specialite: string;
  produits: Product[];
}

interface Product {
  id: number;
  nom: string;
  prix: number;
  stock: number;
  category: string;
}

interface FranchiseStock {
  id: number;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  notes: string;
  dateExpiration: string;
  isExpired: boolean;
  product: Product;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [myStock, setMyStock] = useState<FranchiseStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warehouses' | 'stock'>('warehouses');

  useEffect(() => {
    fetchWarehouses();
    if (activeTab === 'stock') {
      fetchMyStock();
    }
  }, [activeTab]);

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStock = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/warehouses/my-stock', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyStock(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du stock:', error);
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

  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏭 Entrepôts Driv'n Cook
          </h1>
          <p className="text-gray-600">
            Découvrez nos entrepôts et leurs spécialités
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'warehouses'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🏭 Entrepôts
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'stock'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📦 Mon Stock ({myStock.length})
          </button>
        </div>

        {/* Lien vers la gestion des achats */}
        <div className="text-center mb-6">
          <a
            href="/warehouses/stock-management"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            🛒 Gérer mes achats de stock
            <span className="ml-2 text-sm">(Règle des 80%)</span>
          </a>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg -mt-6 -mx-6 mb-4">
                  <h3 className="text-lg font-bold">{warehouse.nom}</h3>
                  <p className="text-blue-100 text-sm">{warehouse.specialite}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">📍 {warehouse.adresse}</p>
                  <p className="text-sm text-gray-600">📦 {warehouse.produits.length} produits</p>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {warehouse.produits.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{product.nom}</span>
                      <span className="text-sm text-green-600">{product.prix}€</span>
                    </div>
                  ))}
                  {warehouse.produits.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{warehouse.produits.length - 3} autres produits
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* Résumé du stock */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">📦 Mon Stock Personnel</h3>
              
              {myStock.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">Votre stock personnel est vide</p>
                  <p className="text-sm mt-2">Achetez des produits dans nos entrepôts pour commencer !</p>
                  <a
                    href="/warehouses/stock-management"
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    🛒 Acheter du stock
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{myStock.length}</div>
                    <div className="text-blue-800">Produits en stock</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {myStock.reduce((sum, item) => sum + item.quantite, 0)}
                    </div>
                    <div className="text-green-800">Articles au total</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {myStock.filter(item => isExpiringSoon(item.dateExpiration)).length}
                    </div>
                    <div className="text-yellow-800">Expirent bientôt</div>
                  </div>
                </div>
              )}
            </div>

            {/* Liste du stock */}
            {myStock.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold mb-4">📋 Détail de mon stock</h4>
                <div className="space-y-4">
                  {myStock.map((item) => (
                    <div key={item.id} className={`p-4 rounded-lg border ${
                      item.isExpired ? 'bg-red-50 border-red-200' :
                      isExpiringSoon(item.dateExpiration) ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.product.nom}</h5>
                          <p className="text-sm text-gray-600">{getCategoryLabel(item.product.category)}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">Quantité: <strong>{item.quantite}</strong></span>
                            <span className="text-gray-600">Prix unitaire: <strong>{item.prixUnitaire}€</strong></span>
                            <span className="text-gray-600">Total: <strong>{item.prixTotal}€</strong></span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            item.isExpired ? 'bg-red-100 text-red-800' :
                            isExpiringSoon(item.dateExpiration) ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.isExpired ? '❌ Expiré' :
                             isExpiringSoon(item.dateExpiration) ? '⚠️ Expire bientôt' :
                             '✅ Bon état'}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Expire le {formatDate(item.dateExpiration)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 