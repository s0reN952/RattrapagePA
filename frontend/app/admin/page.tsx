'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  Users, 
  Euro, 
  BarChart3, 
  Warehouse, 
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardData {
  financial: {
    totalSales: number;
    totalCommissions: number;
    totalEntryFees: number;
    totalRevenue: number;
  };
  franchises: {
    total: number;
    active: number;
    compliant: number;
  };
  trucks: {
    total: number;
    assigned: number;
    available: number;
  };
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration Driv'n Cook</h1>
              <p className="text-gray-600">Gestion des services franchisés</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Chiffre d'affaires */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Euro className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">CA Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.financial.totalSales.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12% ce mois
            </div>
          </div>

          {/* Franchisés */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Franchisés</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.franchises.total}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {dashboardData?.franchises.compliant} conformes
            </div>
          </div>

          {/* Camions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Camions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.trucks.total}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {dashboardData?.trucks.available} disponibles
            </div>
          </div>

          {/* Revenus */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenus</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData?.financial.totalRevenue.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <Euro className="w-4 h-4 mr-1" />
              Commissions + Droits d'entrée
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Truck className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium">Attribuer un camion</span>
              </button>
              <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium">Valider un franchisé</span>
              </button>
              <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Warehouse className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium">Gérer les stocks</span>
              </button>
              <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <BarChart3 className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium">Générer un rapport</span>
              </button>
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Alertes</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">Stock faible</p>
                  <p className="text-xs text-red-600">5 produits en rupture</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Maintenance</p>
                  <p className="text-xs text-yellow-600">2 camions à réviser</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Nouveaux franchisés</p>
                  <p className="text-xs text-blue-600">3 demandes en attente</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation vers les modules */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Modules d'administration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin/franchises" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Gestion des franchisés</p>
                <p className="text-sm text-gray-600">Validation, suivi, support</p>
              </div>
            </a>
            <a href="/admin/trucks" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Truck className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Parc de camions</p>
                <p className="text-sm text-gray-600">Maintenance, attribution</p>
              </div>
            </a>
            <a href="/admin/financial" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Euro className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Suivi financier</p>
                <p className="text-sm text-gray-600">Commissions, conformité</p>
              </div>
            </a>
            <a href="/admin/warehouses" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Warehouse className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Gestion des entrepôts</p>
                <p className="text-sm text-gray-600">Stocks, produits</p>
              </div>
            </a>
            <a href="/admin/reports" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="w-6 h-6 text-indigo-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Rapports</p>
                <p className="text-sm text-gray-600">Statistiques, analyses</p>
              </div>
            </a>
            <a href="/admin/settings" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-6 h-6 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Paramètres</p>
                <p className="text-sm text-gray-600">Configuration système</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 