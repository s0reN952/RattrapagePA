"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Warehouse,
  FileText,
  Settings,
  Crown
} from 'lucide-react';

interface DashboardStats {
  totalFranchises: number;
  operationalFranchises: number;
  pendingPayment: number;
  pendingTruck: number;
  totalRevenue: number;
  monthlyGrowth: number;
  totalTrucks: number;
  availableTrucks: number;
  complianceRate: number;
  lowStockProducts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFranchises: 0,
    operationalFranchises: 0,
    pendingPayment: 0,
    pendingTruck: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    totalTrucks: 0,
    availableTrucks: 0,
    complianceRate: 0,
    lowStockProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Administration Driv'n Cook</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                <Crown className="h-4 w-4 mr-2" />
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Rapides - EN HAUT */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 text-red-600 mr-2" />
              Actions Rapides
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/admin/trucks')}
                className="flex items-center justify-center p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Truck className="h-5 w-5 mr-2" />
                Attribuer un camion
              </button>
              <button 
                onClick={() => router.push('/admin/franchises')}
                className="flex items-center justify-center p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Users className="h-5 w-5 mr-2" />
                Valider un franchisé
              </button>
              <button 
                onClick={() => router.push('/admin/warehouses')}
                className="flex items-center justify-center p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Warehouse className="h-5 w-5 mr-2" />
                Gérer les stocks
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - EN BAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Franchisés */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Franchisés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFranchises || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-600">{stats.operationalFranchises || 0} opérationnels</span>
            </div>
          </div>

          {/* CA Total */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats.totalRevenue || 0).toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-600">+{stats.monthlyGrowth || 0}% ce mois</span>
            </div>
          </div>

          {/* Camions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flotte Camions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTrucks || 0}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-blue-600">{stats.availableTrucks || 0} disponibles</span>
            </div>
          </div>

          {/* Conformité */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conformité 80/20</p>
                <p className="text-3xl font-bold text-gray-900">{stats.complianceRate || 0}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-600">Conformité globale</span>
            </div>
          </div>
        </div>

        {/* Alertes et Résumé - EN BAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alertes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                Alertes
              </h2>
              <div className="space-y-4">
                {(stats.pendingPayment || 0) > 0 && (
                  <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        {stats.pendingPayment || 0} franchisé(s) en attente de paiement
                      </p>
                    </div>
                  </div>
                )}
                
                {(stats.pendingTruck || 0) > 0 && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Truck className="h-4 w-4 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {stats.pendingTruck || 0} franchisé(s) en attente de camion
                      </p>
                    </div>
                  </div>
                )}

                {(stats.lowStockProducts || 0) > 0 && (
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <Warehouse className="h-4 w-4 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {stats.lowStockProducts || 0} produit(s) en rupture
                      </p>
                    </div>
                  </div>
                )}

                {(stats.pendingPayment || 0) === 0 && (stats.pendingTruck || 0) === 0 && (stats.lowStockProducts || 0) === 0 && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Aucune alerte en cours
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Résumé des Statuts */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                Résumé des Statuts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.operationalFranchises || 0}</div>
                  <div className="text-sm text-gray-600">Opérationnels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingPayment || 0}</div>
                  <div className="text-sm text-gray-600">En attente de paiement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.pendingTruck || 0}</div>
                  <div className="text-sm text-gray-600">En attente de camion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {(stats.totalFranchises || 0) - (stats.operationalFranchises || 0) - (stats.pendingPayment || 0) - (stats.pendingTruck || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Inactifs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 