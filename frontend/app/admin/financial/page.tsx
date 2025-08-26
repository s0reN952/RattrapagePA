'use client';

import { useState, useEffect } from 'react';
import { 
  Euro, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

interface FinancialOverview {
  totalSales: number;
  totalCommissions: number;
  totalEntryFees: number;
  totalRevenue: number;
}

interface FranchiseCompliance {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  totalSales: number;
  commission: number;
  mandatoryPurchases: number;
  compliance: {
    entryFee: boolean;
    commissionPaid: boolean;
    mandatoryPurchases: boolean;
  };
}

export default function FinancialManagement() {
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [franchiseCompliance, setFranchiseCompliance] = useState<FranchiseCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCompliance, setFilterCompliance] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [overviewResponse, complianceResponse] = await Promise.all([
        fetch('/api/admin/financial/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/financial/compliance', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setFinancialOverview(overviewData);
      }

      if (complianceResponse.ok) {
        const complianceData = await complianceResponse.json();
        setFranchiseCompliance(complianceData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatus = (franchise: FranchiseCompliance) => {
    const { entryFee, commissionPaid, mandatoryPurchases } = franchise.compliance;
    
    if (entryFee && commissionPaid && mandatoryPurchases) {
      return { status: 'compliant', label: 'Conforme', color: 'green', icon: CheckCircle };
    } else if (entryFee) {
      return { status: 'partial', label: 'Partiellement conforme', color: 'yellow', icon: AlertCircle };
    } else {
      return { status: 'non-compliant', label: 'Non conforme', color: 'red', icon: XCircle };
    }
  };

  const filteredCompliance = franchiseCompliance.filter(franchise => {
    if (filterCompliance === 'all') return true;
    const compliance = getComplianceStatus(franchise);
    return compliance.status === filterCompliance;
  });

  const generateReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      
      const response = await fetch(`/api/admin/reports/sales?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const reportData = await response.json();
        // Ici vous pourriez télécharger le rapport ou l'afficher
        console.log('Rapport généré:', reportData);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
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
              <h1 className="text-3xl font-bold text-gray-900">Suivi financier</h1>
              <p className="text-gray-600">Commissions, conformité et revenus</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={generateReport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Générer rapport
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vue d'ensemble financière */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* CA Total */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {financialOverview?.totalSales.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +15% ce mois
            </div>
          </div>

          {/* Commissions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commissions (4%)</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {financialOverview?.totalCommissions.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <BarChart3 className="w-4 h-4 mr-1" />
              4% du CA
            </div>
          </div>

          {/* Droits d'entrée */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Euro className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Droits d'entrée</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {financialOverview?.totalEntryFees.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              50 000€ par franchisé
            </div>
          </div>

          {/* Revenus totaux */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {financialOverview?.totalRevenue.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-yellow-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Commissions + Droits
            </div>
          </div>
        </div>

        {/* Conformité des franchisés */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Conformité des franchisés</h3>
            <div className="flex gap-2">
              <select
                value={filterCompliance}
                onChange={(e) => setFilterCompliance(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="compliant">Conformes</option>
                <option value="partial">Partiellement conformes</option>
                <option value="non-compliant">Non conformes</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Franchisé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CA Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission (4%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Achats obligatoires (80%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conformité
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompliance.map((franchise) => {
                  const compliance = getComplianceStatus(franchise);
                  const IconComponent = compliance.icon;
                  
                  return (
                    <tr key={franchise.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {franchise.prenom[0]}{franchise.nom[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {franchise.prenom} {franchise.nom}
                            </div>
                            <div className="text-sm text-gray-500">{franchise.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {franchise.totalSales.toLocaleString('fr-FR')} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {franchise.commission.toLocaleString('fr-FR')} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {franchise.mandatoryPurchases.toLocaleString('fr-FR')} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          compliance.color === 'green' ? 'bg-green-100 text-green-800' :
                          compliance.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          <IconComponent className="w-4 h-4 mr-1" />
                          {compliance.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            franchise.compliance.entryFee 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {franchise.compliance.entryFee ? '✓' : '✗'}
                          </span>
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            franchise.compliance.commissionPaid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {franchise.compliance.commissionPaid ? '✓' : '✗'}
                          </span>
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            franchise.compliance.mandatoryPurchases 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {franchise.compliance.mandatoryPurchases ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Résumé de conformité */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Franchisés conformes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {franchiseCompliance.filter(f => 
                    f.compliance.entryFee && 
                    f.compliance.commissionPaid && 
                    f.compliance.mandatoryPurchases
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Partiellement conformes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {franchiseCompliance.filter(f => 
                    f.compliance.entryFee && 
                    (!f.compliance.commissionPaid || !f.compliance.mandatoryPurchases)
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Non conformes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {franchiseCompliance.filter(f => !f.compliance.entryFee).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 