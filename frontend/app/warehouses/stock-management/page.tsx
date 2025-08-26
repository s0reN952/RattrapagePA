"use client";
import { useState, useEffect } from 'react';

interface Product {
  id: number;
  nom: string;
  prix: number;
  stock: number;
  category: 'nourriture' | 'boisson' | 'dessert' | 'ingredient' | 'plat_prepare';
  description?: string;
  isBio: boolean;
  isLocal: boolean;
  fournisseur?: string;
  warehouse: {
    id: number;
    nom: string;
    specialite: string;
  };
}

interface CartItem {
  product: Product | null;
  quantity: number;
  isFromDrivnCook: boolean;
}

interface StockRequirement {
  category: string;
  requiredPercentage: number;
  currentPercentage: number;
  items: CartItem[];
}

export default function StockManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'compliance'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/warehouses/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    const existingItem = cart.find(item => item.product && item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product && item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      const isFromDrivnCook = true; // Tous les produits des entrepôts sont de Driv'n Cook
      setCart([...cart, { product, quantity, isFromDrivnCook }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product && item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.product && item.product.id === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + ((item.product?.prix || 0) * item.quantity), 0);
  };

  const getDrivnCookPercentage = () => {
    if (cart.length === 0) return 0;
    const drivnCookItems = cart.filter(item => item.isFromDrivnCook);
    const drivnCookTotal = drivnCookItems.reduce((total, item) => total + ((item.product?.prix || 0) * item.quantity), 0);
    return Math.round((drivnCookTotal / getTotalPrice()) * 100);
  };

  const isCompliant = () => {
    return getDrivnCookPercentage() >= 80;
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (selectedWarehouse !== 0) {
      filtered = filtered.filter(product => product.warehouse?.id === selectedWarehouse);
    }
    
    return filtered;
  };

  const getWarehouses = () => {
    const warehouses = products.reduce((acc, product) => {
      if (product.warehouse && !acc.find(w => w.id === product.warehouse.id)) {
        acc.push(product.warehouse);
      }
      return acc;
    }, [] as any[]);
    return warehouses;
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

  const handleValidateOrder = async () => {
    if (!isCompliant()) {
      alert('La commande ne respecte pas la règle des 80%');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        items: cart.map(item => ({
          product: item.product,
          quantite: item.quantity,
          prixTotal: (item.product?.prix || 0) * item.quantity
        }))
      };

      const response = await fetch('/api/warehouses/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Commande validée avec succès !');
          setCart([]); // Vider le panier
          setActiveTab('catalog'); // Retourner au catalogue
        } else {
          alert('Erreur: ' + result.message);
        }
      } else {
        alert('Erreur lors de la validation de la commande');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation de la commande');
    }
  };

  const handlePayment = async () => {
    if (!isCompliant()) {
      alert('❌ Votre commande ne respecte pas la règle des 80%. Vous devez acheter au moins 80% de vos produits dans nos entrepôts Driv\'n Cook.');
      return;
    }

    if (cart.length === 0) {
      alert('❌ Votre panier est vide !');
      return;
    }

    setProcessingPayment(true);

    try {
      const userEmail = localStorage.getItem('userEmail') || 'franchise@drivncook.com';
      const orderData = {
        items: cart.map(item => ({
          product: item.product,
          quantite: item.quantity,
          prixTotal: (item.product?.prix || 0) * item.quantity
        })),
        total: getTotalPrice(),
        compliance: {
          percentage: getDrivnCookPercentage(),
          isCompliant: isCompliant()
        },
        userEmail: userEmail
      };

      // Créer la session de paiement via le backend
      const response = await fetch('/api/warehouses/payment/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.sessionUrl) {
          // Rediriger vers Stripe pour le vrai paiement
          window.location.href = result.sessionUrl;
        } else {
          alert('❌ Erreur lors de la création de la session de paiement: ' + result.message);
        }
      } else {
        const errorData = await response.json();
        alert('❌ Erreur: ' + (errorData.message || 'Erreur lors de la création de la session de paiement'));
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      alert('❌ Erreur lors du paiement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setProcessingPayment(false);
    }
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
            🛒 Gestion des Achats de Stock
          </h1>
          <p className="text-gray-600">
            Achetez vos produits avec 80% obligatoire dans nos entrepôts Driv'n Cook
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Catalogue
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`px-4 py-2 rounded-lg font-medium relative ${
              activeTab === 'cart'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🛒 Panier ({cart.length})
            {!isCompliant() && cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                ⚠️
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'compliance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Conformité
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 Recherche
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📂 Catégorie
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="nourriture">Nourriture</option>
                    <option value="boisson">Boisson</option>
                    <option value="dessert">Dessert</option>
                    <option value="ingredient">Ingrédient</option>
                    <option value="plat_prepare">Plat préparé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏭 Entrepôt
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Tous les entrepôts</option>
                    {getWarehouses().map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.nom} - {warehouse.specialite}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Produits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredProducts().map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{product.nom}</h3>
                      <p className="text-sm text-gray-600">{getCategoryLabel(product.category)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{product.prix}€</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">🏭 {product.warehouse?.nom || 'Entrepôt inconnu'}</span>
                      <span className="text-gray-500">({product.warehouse?.specialite || 'Spécialité inconnue'})</span>
                    </div>
                    <div className="flex gap-2">
                      {product.isBio && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">🌱 Bio</span>}
                      {product.isLocal && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">📍 Local</span>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      defaultValue="1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id={`quantity-${product.id}`}
                    />
                    <button
                      onClick={() => {
                        const quantity = parseInt((document.getElementById(`quantity-${product.id}`) as HTMLInputElement).value);
                        addToCart(product, quantity);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="space-y-6">
            {/* Résumé de conformité */}
            <div className={`bg-white rounded-lg shadow-md p-6 ${
              isCompliant() ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    📊 Conformité des Achats
                  </h3>
                  <p className={`text-lg font-medium ${
                    isCompliant() ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {getDrivnCookPercentage()}% des achats dans nos entrepôts
                    {isCompliant() ? ' ✅ Conforme' : ' ❌ Non conforme (minimum 80%)'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">Total: {getTotalPrice().toFixed(2)}€</p>
                  <p className="text-sm text-gray-500">{cart.length} produits</p>
                </div>
              </div>
            </div>

            {/* Panier */}
            {cart.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
                <p className="text-gray-500 text-lg">Votre panier est vide</p>
                <p className="text-sm text-gray-400 mt-2">Ajoutez des produits depuis le catalogue</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">🛒 Produits dans le panier</h3>
                <div className="space-y-4">
                  {cart.map((item) => (
                    item.product && (
                      <div key={item.product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product?.nom || 'Produit inconnu'}</h4>
                          <p className="text-sm text-gray-600">
                            {item.product?.warehouse?.nom || 'Entrepôt inconnu'} - {getCategoryLabel(item.product?.category || 'inconnue')}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {item.isFromDrivnCook && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                🏭 Driv'n Cook
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => item.product && updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 bg-white border border-gray-300 rounded min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => item.product && updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {((item.product?.prix || 0) * item.quantity).toFixed(2)}€
                            </p>
                            <p className="text-sm text-gray-500">{item.product?.prix || 0}€/unité</p>
                          </div>
                          <button
                            onClick={() => item.product && removeFromCart(item.product.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      ← Continuer les achats
                    </button>
                    <button
                      disabled={!isCompliant()}
                      onClick={handleValidateOrder}
                      className={`px-6 py-3 rounded-md font-medium ${
                        isCompliant()
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isCompliant() ? '✅ Valider la commande' : '❌ Règle des 80% non respectée'}
                    </button>
                    
                    {isCompliant() && (
                      <button
                        onClick={handlePayment}
                        disabled={processingPayment}
                        className={`px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 ml-4 ${
                          processingPayment ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {processingPayment ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Traitement...
                          </div>
                        ) : (
                          '💳 Payer maintenant'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Explication des règles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">📋 Règles de Conformité</h3>
              <div className="space-y-3 text-blue-800">
                <p><strong>Règle des 80% :</strong> Vous devez acheter au minimum 80% de votre stock dans nos entrepôts Driv'n Cook.</p>
                <p><strong>20% libre :</strong> Les 20% restants peuvent être achetés chez d'autres fournisseurs de votre choix.</p>
                <p><strong>Avantages :</strong> Qualité garantie, produits frais et locaux, support logistique complet.</p>
              </div>
            </div>

            {/* Statistiques actuelles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">📊 Votre Situation Actuelle</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{getDrivnCookPercentage()}%</div>
                  <p className="text-blue-800">Achats Driv'n Cook</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600">{100 - getDrivnCookPercentage()}%</div>
                  <p className="text-gray-800">Achats libres</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {isCompliant() ? '✅' : '❌'}
                  </div>
                  <p className="text-green-800">Conformité</p>
                </div>
              </div>
            </div>

            {/* Recommandations */}
            {!isCompliant() && cart.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-yellow-900 mb-4">💡 Recommandations</h3>
                <p className="text-yellow-800 mb-3">
                  Pour respecter la règle des 80%, vous devez :
                </p>
                <ul className="list-disc list-inside space-y-2 text-yellow-800">
                  <li>Augmenter vos achats dans nos entrepôts Driv'n Cook</li>
                  <li>Réduire vos achats externes</li>
                  <li>Privilégier nos produits de qualité</li>
                </ul>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  🛒 Continuer les achats
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
