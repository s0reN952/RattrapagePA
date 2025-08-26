'use client';

import { useState, useEffect } from 'react';

interface Warehouse {
  id?: number;
  nom: string;
  adresse: string;
  description: string;
  specialite: string;
  zone: string;
  statut: 'actif' | 'inactif' | 'maintenance';
  isOperational: boolean;
  heureOuverture: string;
  heureFermeture: string;
  fraisLivraison: number;
  delaiLivraisonHeures: number;
}

interface Product {
  id: number;
  nom: string;
  description: string;
  prix: number;
  category: string;
  stock: number;
  isAvailable: boolean;
  warehouse?: Warehouse;
}

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warehouses' | 'products'>('warehouses');
  
  // États pour les formulaires
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // États pour les formulaires
  const [warehouseForm, setWarehouseForm] = useState<Warehouse>({
    nom: '',
    adresse: '',
    description: '',
    specialite: '',
    zone: '',
    statut: 'actif',
    isOperational: true,
    heureOuverture: '08:00:00',
    heureFermeture: '18:00:00',
    fraisLivraison: 0,
    delaiLivraisonHeures: 24
  });
  
  const [productForm, setProductForm] = useState({
    nom: '',
    description: '',
    prix: 0,
    category: 'nourriture',
    stock: 0,
    isAvailable: true,
    warehouseId: 0
  });

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (!token) {
      // Rediriger vers la page de login si pas de token
      window.location.href = '/login';
      return;
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [warehousesRes, productsRes] = await Promise.all([
        fetch('/api/admin/warehouses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/admin/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      
      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData);
      }
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingWarehouse 
        ? `/api/admin/warehouses/${editingWarehouse.id}`
        : '/api/admin/warehouses';
      
      const method = editingWarehouse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(warehouseForm)
      });
      
      if (response.ok) {
        setShowWarehouseForm(false);
        setEditingWarehouse(null);
        setWarehouseForm({
          nom: '',
          adresse: '',
          description: '',
          specialite: '',
          zone: '',
          statut: 'actif',
          isOperational: true,
          heureOuverture: '08:00:00',
          heureFermeture: '18:00:00',
          fraisLivraison: 0,
          delaiLivraisonHeures: 24
        });
        fetchData();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productForm)
      });
      
      if (response.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({
          nom: '',
          description: '',
          prix: 0,
          category: 'nourriture',
          stock: 0,
          isAvailable: true,
          warehouseId: 0
        });
        fetchData();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const editWarehouse = (warehouse: Warehouse) => {
    setWarehouseForm({
      nom: warehouse.nom,
      adresse: warehouse.adresse,
      description: warehouse.description,
      specialite: warehouse.specialite,
      zone: warehouse.zone,
      statut: warehouse.statut,
      isOperational: warehouse.isOperational,
      heureOuverture: warehouse.heureOuverture,
      heureFermeture: warehouse.heureFermeture,
      fraisLivraison: warehouse.fraisLivraison,
      delaiLivraisonHeures: warehouse.delaiLivraisonHeures
    });
    setEditingWarehouse(warehouse);
    setShowWarehouseForm(true);
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      nom: product.nom,
      description: product.description,
      prix: product.prix,
      category: product.category,
      stock: product.stock,
      isAvailable: product.isAvailable,
      warehouseId: product.warehouse?.id || 0
    });
    setShowProductForm(true);
  };

  const deleteWarehouse = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet entrepôt ?')) {
      try {
        const response = await fetch(`/api/admin/warehouses/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const deleteProduct = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const response = await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Entrepôts et Produits
          </h1>
          <p className="text-gray-600">
            Gérez les entrepôts Driv'n Cook et leurs produits
          </p>
        </div>

        {/* Onglets */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('warehouses')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'warehouses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏢 Entrepôts ({warehouses.length})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 Produits ({products.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'warehouses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Liste des Entrepôts
              </h2>
              <button
                onClick={() => {
                  setEditingWarehouse(null);
                  setWarehouseForm({
                    nom: '',
                    adresse: '',
                    description: '',
                    specialite: '',
                    zone: '',
                    statut: 'actif',
                    isOperational: true,
                    heureOuverture: '08:00:00',
                    heureFermeture: '18:00:00',
                    fraisLivraison: 0,
                    delaiLivraisonHeures: 24
                  });
                  setShowWarehouseForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                ➕ Nouvel Entrepôt
              </button>
            </div>

            {/* Tableau des entrepôts */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {warehouses.map((warehouse) => (
                    <tr key={warehouse.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {warehouse.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {warehouse.adresse}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          warehouse.isOperational && warehouse.statut === 'actif'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {warehouse.isOperational && warehouse.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* Nombre de produits sera affiché ici */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => editWarehouse(warehouse)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => deleteWarehouse(warehouse.id || 0)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Liste des Produits
              </h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    nom: '',
                    description: '',
                    prix: 0,
                    category: 'nourriture',
                    stock: 0,
                    isAvailable: true,
                    warehouseId: 0
                  });
                  setShowProductForm(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                ➕ Nouveau Produit
              </button>
            </div>

            {/* Tableau des produits */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrepôt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof product.prix === 'number' ? product.prix.toFixed(2) : '0.00'} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`${
                          product.stock > 10 ? 'text-green-600' : 
                          product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {product.stock} unités
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.warehouse?.nom || 'Non assigné'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => editProduct(product)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Entrepôt */}
        {showWarehouseForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingWarehouse ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
                </h3>
                <form onSubmit={handleWarehouseSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <input
                        type="text"
                        value={warehouseForm.nom}
                        onChange={(e) => setWarehouseForm({...warehouseForm, nom: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adresse</label>
                      <input
                        type="text"
                        value={warehouseForm.adresse}
                        onChange={(e) => setWarehouseForm({...warehouseForm, adresse: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={warehouseForm.description}
                        onChange={(e) => setWarehouseForm({...warehouseForm, description: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Spécialité</label>
                      <input
                        type="text"
                        value={warehouseForm.specialite}
                        onChange={(e) => setWarehouseForm({...warehouseForm, specialite: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Zone</label>
                      <select
                        value={warehouseForm.zone}
                        onChange={(e) => setWarehouseForm({...warehouseForm, zone: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Sélectionner une zone</option>
                        <option value="Paris Nord">Paris Nord</option>
                        <option value="Paris Sud">Paris Sud</option>
                        <option value="Paris Est">Paris Est</option>
                        <option value="Paris Ouest">Paris Ouest</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <select
                        value={warehouseForm.statut}
                        onChange={(e) => setWarehouseForm({...warehouseForm, statut: e.target.value as any})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Opérationnel</label>
                      <select
                        value={warehouseForm.isOperational ? 'true' : 'false'}
                        onChange={(e) => setWarehouseForm({...warehouseForm, isOperational: e.target.value === 'true'})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Heure d'ouverture</label>
                      <input
                        type="time"
                        value={warehouseForm.heureOuverture}
                        onChange={(e) => setWarehouseForm({...warehouseForm, heureOuverture: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Heure de fermeture</label>
                      <input
                        type="time"
                        value={warehouseForm.heureFermeture}
                        onChange={(e) => setWarehouseForm({...warehouseForm, heureFermeture: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Frais de livraison (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={warehouseForm.fraisLivraison}
                        onChange={(e) => setWarehouseForm({...warehouseForm, fraisLivraison: parseFloat(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Délai de livraison (heures)</label>
                      <input
                        type="number"
                        value={warehouseForm.delaiLivraisonHeures}
                        onChange={(e) => setWarehouseForm({...warehouseForm, delaiLivraisonHeures: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowWarehouseForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {editingWarehouse ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Produit */}
        {showProductForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                </h3>
                <form onSubmit={handleProductSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du produit
                    </label>
                    <input
                      type="text"
                      value={productForm.nom}
                      onChange={(e) => setProductForm({...productForm, nom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                   
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                   
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.prix}
                        onChange={(e) => setProductForm({...productForm, prix: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                   
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="nourriture">Nourriture</option>
                      <option value="boisson">Boisson</option>
                      <option value="dessert">Dessert</option>
                      <option value="ingredient">Ingrédient</option>
                      <option value="plat_prepare">Plat préparé</option>
                    </select>
                  </div>
                   
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entrepôt
                    </label>
                    <select
                      value={productForm.warehouseId}
                      onChange={(e) => setProductForm({...productForm, warehouseId: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value={0}>Sélectionner un entrepôt</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                   
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={productForm.isAvailable}
                        onChange={(e) => setProductForm({...productForm, isAvailable: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Produit disponible
                      </span>
                    </label>
                  </div>
                   
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      {editingProduct ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 