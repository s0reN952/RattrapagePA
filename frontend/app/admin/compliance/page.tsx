"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  RefreshCw,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

interface Franchise {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

interface SalesData {
  periode: string;
  chiffre_affaires: number;
  nombre_commandes: number;
  date_creation: string;
}

interface OrderData {
  id: number;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  valeurTotale: number;
  emplacement: string;
  createdAt: string;
}

interface ComplianceRecord {
  id: number;
  franchise: Franchise;
  periode: Date;
  chiffreAffairesTotal: number;
  achatsObligatoires: number;
  achatsLibres: number;
  pourcentageConformite: number;
  estConforme: boolean;
  notes: string;
  typePeriode: 'monthly' | 'quarterly';
  createdAt: Date;
}

interface ComplianceOverview {
  summary: {
    totalFranchises: number;
    conformes: number;
    nonConformes: number;
    tauxConformite: number;
  };
  financial: {
    totalCA: number;
    totalAchatsObligatoires: number;
    totalAchatsLibres: number;
    moyenneConformite: number;
  };
  franchises: Array<{
    franchise: Franchise;
    sales: SalesData[];
    stock: OrderData[];
    compliance: ComplianceRecord | null;
    totalCA: number;
    totalAchats: number;
    pourcentageAchats: number;
    estConforme: boolean;
  }>;
}

export default function AdminCompliancePage() {
  const [complianceData, setComplianceData] = useState<ComplianceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFranchise, setSelectedFranchise] = useState<number | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [showNonConformesOnly, setShowNonConformesOnly] = useState(false);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, [period]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/compliance/overview?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComplianceData(data);
      } else {
        setError('Erreur lors du chargement des données');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const checkAllFranchisesCompliance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/compliance/check-all', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period, month: new Date().getMonth() + 1, year: new Date().getFullYear() })
      });
      
      if (response.ok) {
        setSuccess('Vérification de conformité terminée pour tous les franchisés');
        fetchComplianceData(); // Recharger les données
      } else {
        setError('Erreur lors de la vérification');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (pourcentage: number) => {
    if (pourcentage >= 80) return 'text-green-600 bg-green-100';
    if (pourcentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (estConforme: boolean) => {
    return estConforme ? 
      <CheckCircle className="w-5 h-5 text-green-600" /> : 
      <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const filteredFranchises = complianceData?.franchises.filter(franchise => {
    if (showNonConformesOnly && franchise.estConforme) return false;
    if (selectedFranchise && franchise.franchise.id !== selectedFranchise) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conformité 80/20 - Contrôle des Stocks</h1>
          <p className="text-gray-600">
            Surveillance des achats des franchisés et vérification du respect de la règle 80% Driv'n Cook / 20% libre
          </p>
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          </div>
        )}

        {/* Vue d'ensemble des statistiques */}
        {complianceData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux de Conformité</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {complianceData.summary.tauxConformite.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">CA Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {complianceData.financial.totalCA.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Achats 80%</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {complianceData.financial.totalAchatsObligatoires.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Achats 20%</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {complianceData.financial.totalAchatsLibres.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions et filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Période:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'monthly' | 'quarterly')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Franchisé:</label>
                <select
                  value={selectedFranchise || ''}
                  onChange={(e) => setSelectedFranchise(e.target.value ? Number(e.target.value) : null)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Tous</option>
                  {complianceData?.franchises.map(franchise => (
                    <option key={franchise.franchise.id} value={franchise.franchise.id}>
                      {franchise.franchise.prenom} {franchise.franchise.nom}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showNonConformesOnly}
                  onChange={(e) => setShowNonConformesOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Non-conformes uniquement</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={checkAllFranchisesCompliance}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Vérifier tous
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des franchisés avec détails */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Détail de la Conformité par Franchisé ({filteredFranchises.length})
            </h3>
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
                    Achats Driv'n Cook
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Achats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conformité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFranchises.map((franchiseData) => (
                  <tr key={franchiseData.franchise.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {franchiseData.franchise.prenom} {franchiseData.franchise.nom}
                        </div>
                        <div className="text-sm text-gray-500">{franchiseData.franchise.email}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {franchiseData.totalCA.toLocaleString('fr-FR')} €
                      </div>
                      <div className="text-sm text-gray-500">
                        {franchiseData.sales.length} ventes
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {franchiseData.totalAchats.toLocaleString('fr-FR')} €
                      </div>
                      <div className="text-sm text-gray-500">
                        {franchiseData.stock?.length || 0} articles en stock
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(franchiseData.pourcentageAchats)}`}>
                        {franchiseData.pourcentageAchats.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {franchiseData.pourcentageAchats >= 80 ? '✅ Conforme' : '❌ Non-conforme'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(franchiseData.estConforme)}
                        <span className={`ml-2 text-sm font-medium ${
                          franchiseData.estConforme ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {franchiseData.estConforme ? 'Conforme' : 'Non-conforme'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setShowDetails(showDetails === franchiseData.franchise.id ? null : franchiseData.franchise.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        {showDetails === franchiseData.franchise.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {showDetails === franchiseData.franchise.id ? ' Masquer' : ' Détails'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Détails des ventes et achats pour chaque franchisé */}
        {filteredFranchises.map((franchiseData) => (
          showDetails === franchiseData.franchise.id && (
            <div key={`details-${franchiseData.franchise.id}`} className="mt-6 bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-lg font-medium text-gray-900">
                  Détails pour {franchiseData.franchise.prenom} {franchiseData.franchise.nom}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Détail des ventes */}
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Ventes ({franchiseData.sales.length})
                  </h5>
                  <div className="space-y-3">
                    {franchiseData.sales.map((sale, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-green-900">
                              {sale.chiffre_affaires.toLocaleString('fr-FR')} €
                            </div>
                            <div className="text-sm text-green-700">
                              {sale.nombre_commandes} commandes - {sale.periode}
                            </div>
                          </div>
                          <div className="text-xs text-green-600">
                            {new Date(sale.date_creation).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Détail des achats */}
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Achats Driv'n Cook ({franchiseData.stock.length})
                  </h5>
                  <div className="space-y-3">
                    {franchiseData.stock.map((order) => (
                      <div key={order.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-blue-900">
                              {order.valeurTotale.toLocaleString('fr-FR')} €
                            </div>
                            <div className="text-sm text-blue-700">
                              {order.produit} - {order.quantite} x {order.prixUnitaire.toLocaleString('fr-FR')}€
                            </div>
                            <div className="text-xs text-blue-600">
                              {order.emplacement}
                            </div>
                          </div>
                          <div className="text-xs text-blue-600">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Résumé de conformité */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <strong>Résumé :</strong> CA total de {franchiseData.totalCA.toLocaleString('fr-FR')}€ 
                    → Achats obligatoires de {franchiseData.totalAchats.toLocaleString('fr-FR')}€ 
                    ({franchiseData.pourcentageAchats.toFixed(1)}%)
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    franchiseData.estConforme 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {franchiseData.estConforme ? '✅ Conforme 80/20' : '❌ Non-conforme 80/20'}
                  </div>
                </div>
                
                {/* Alerte pour les non-conformes */}
                {!franchiseData.estConforme && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-800">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <strong>Action requise :</strong>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Ce franchisé doit acheter au minimum {(franchiseData.totalCA * 0.8 - franchiseData.totalAchats).toLocaleString('fr-FR')}€ 
                      de produits dans vos entrepôts pour respecter la règle 80/20.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        ))}

        {/* Section spéciale des franchisés non-conformes */}
        {showNonConformesOnly && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Franchisés Non-Conformes - Actions Requises
            </h3>
            
            <div className="space-y-4">
              {filteredFranchises.filter(f => !f.estConforme).map((franchiseData) => (
                <div key={`non-conforme-${franchiseData.franchise.id}`} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {franchiseData.franchise.prenom} {franchiseData.franchise.nom}
                      </h4>
                      <p className="text-sm text-gray-600">{franchiseData.franchise.email}</p>
                      <div className="mt-2 text-sm">
                        <span className="text-red-600">
                          Pourcentage actuel : {franchiseData.pourcentageAchats.toFixed(1)}% 
                          (requis : 80%)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {(franchiseData.totalCA * 0.8 - franchiseData.totalAchats).toLocaleString('fr-FR')}€
                      </div>
                      <div className="text-sm text-red-600">à acheter</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-800">
                    <strong>Message automatique envoyé :</strong> "Vous devez acheter au minimum 
                    {(franchiseData.totalCA * 0.8 - franchiseData.totalAchats).toLocaleString('fr-FR')}€ 
                    de produits dans nos entrepôts Driv'n Cook pour respecter la règle 80/20."
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

