"use client";
import { useState, useEffect } from 'react';

interface Franchise {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
  notes?: string;
  totalSales: number;
  commission: number;
  mandatoryPurchases: number;
  trucksCount: number;
  compliance: {
    entryFee: boolean;
    commissionPaid: boolean;
    mandatoryPurchases: boolean;
  };
  status: string;
}

interface PerformanceData {
  period: string;
  totalSales: number;
  commission: number;
  salesCount: number;
  averageOrderValue: number;
}

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [statusData, setStatusData] = useState({
    isActive: true,
    status: 'actif' as 'actif' | 'suspendu' | 'en_attente' | 'termine',
    reason: '',
    notes: ''
  });
  const [noteData, setNoteData] = useState({
    note: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/franchises', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFranchises(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du chargement des franchisés');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des franchisés:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const updateFranchiseStatus = async () => {
    if (!selectedFranchise) return;

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/franchises/${selectedFranchise.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(statusData),
      });

      if (response.ok) {
        setSuccess('Statut du franchisé mis à jour avec succès !');
        setShowStatusModal(false);
        fetchFranchises();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const addFranchiseNote = async () => {
    if (!selectedFranchise) return;

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/franchises/${selectedFranchise.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        setSuccess('Note ajoutée avec succès !');
        setShowNotesModal(false);
        setNoteData({ note: '', type: 'info' });
        fetchFranchises();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'ajout de la note');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const fetchPerformance = async (franchiseId: number, period: string = 'month') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/franchises/${franchiseId}/performance?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
        setShowPerformanceModal(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des performances:', error);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'Opérationnel': return 'bg-green-100 text-green-800';
      case 'En attente de paiement': return 'bg-yellow-100 text-yellow-800';
      case 'En attente de camion': return 'bg-blue-100 text-blue-800';
      case 'Inactif': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? '✅' : '❌';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des franchisés...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">👥 Gestion des Franchisés</h1>
          <p className="text-gray-600 mt-2">Administration et suivi des franchisés Driv'n Cook</p>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✅ {success}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{franchises.length}</div>
            <div className="text-gray-600">Total Franchisés</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {franchises.filter(f => f.status && f.status === 'Opérationnel').length}
            </div>
            <div className="text-gray-600">Opérationnels</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {franchises.filter(f => f.status && f.status === 'En attente de paiement').length}
            </div>
            <div className="text-gray-600">En attente de paiement</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {franchises.filter(f => f.status && f.status === 'En attente de camion').length}
            </div>
            <div className="text-gray-600">En attente de camion</div>
          </div>
        </div>

        {/* Liste des franchisés */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Liste des Franchisés</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franchisé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conformité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {franchises.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucun franchisé trouvé
                    </td>
                  </tr>
                ) : (
                  franchises.map((franchise) => (
                    <tr key={franchise.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{franchise.prenom} {franchise.nom}</div>
                        <div className="text-sm text-gray-500">{franchise.email}</div>
                        <div className="text-xs text-gray-400">
                          Dernière connexion: {franchise.lastLogin ? new Date(franchise.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(franchise.status)}`}>
                          {franchise.status || 'Statut inconnu'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>CA: {(franchise.totalSales || 0).toLocaleString('fr-FR')}€</div>
                          <div>Commission: {(franchise.commission || 0).toLocaleString('fr-FR')}€</div>
                          <div>Camions: {franchise.trucksCount || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div>{getComplianceIcon(franchise.compliance?.entryFee || false)} Droit d'entrée</div>
                          <div>{getComplianceIcon(franchise.compliance?.commissionPaid || false)} Commission</div>
                          <div>{getComplianceIcon(franchise.compliance?.mandatoryPurchases || false)} Achats obligatoires</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedFranchise(franchise);
                              setShowPerformanceModal(true);
                              fetchPerformance(franchise.id);
                            }}
                            className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            📊 Performance
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFranchise(franchise);
                              setStatusData({
                                isActive: franchise.isActive,
                                status: franchise.status === 'Opérationnel' ? 'actif' : 'en_attente',
                                reason: '',
                                notes: ''
                              });
                              setShowStatusModal(true);
                            }}
                            className="px-3 py-1 text-xs rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          >
                            ⚙️ Statut
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFranchise(franchise);
                              setShowNotesModal(true);
                            }}
                            className="px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            📝 Notes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Performance */}
        {showPerformanceModal && selectedFranchise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                📊 Performance de {selectedFranchise.prenom} {selectedFranchise.nom}
              </h3>
              
              {performanceData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {(performanceData.totalSales || 0).toLocaleString('fr-FR')}€
                      </div>
                      <div className="text-sm text-blue-600">Chiffre d'affaires</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {(performanceData.commission || 0).toLocaleString('fr-FR')}€
                      </div>
                      <div className="text-sm text-green-600">Commission (4%)</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-yellow-50 p-4 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {performanceData.salesCount || 0}
                      </div>
                      <div className="text-sm text-yellow-600">Nombre de ventes</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {(performanceData.averageOrderValue || 0).toLocaleString('fr-FR')}€
                      </div>
                      <div className="text-sm text-purple-600">Panier moyen</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement des performances...</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPerformanceModal(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Statut */}
        {showStatusModal && selectedFranchise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                ⚙️ Modifier le statut de {selectedFranchise.prenom} {selectedFranchise.nom}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Statut</label>
                  <select
                    value={statusData.status}
                    onChange={(e) => setStatusData({ ...statusData, status: e.target.value as any })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="actif">Actif</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="en_attente">En attente</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Actif</label>
                  <input
                    type="checkbox"
                    checked={statusData.isActive}
                    onChange={(e) => setStatusData({ ...statusData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Franchisé actif</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Raison (optionnel)</label>
                  <input
                    type="text"
                    value={statusData.reason}
                    onChange={(e) => setStatusData({ ...statusData, reason: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Raison du changement de statut"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
                  <textarea
                    value={statusData.notes}
                    onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Notes additionnelles"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={updateFranchiseStatus}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Mettre à jour
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Notes */}
        {showNotesModal && selectedFranchise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                📝 Ajouter une note pour {selectedFranchise.prenom} {selectedFranchise.nom}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de note</label>
                  <select
                    value={noteData.type}
                    onChange={(e) => setNoteData({ ...noteData, type: e.target.value as any })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="info">Information</option>
                    <option value="warning">Avertissement</option>
                    <option value="error">Erreur</option>
                    <option value="success">Succès</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Note</label>
                  <textarea
                    value={noteData.note}
                    onChange={(e) => setNoteData({ ...noteData, note: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    rows={4}
                    placeholder="Contenu de la note..."
                    required
                  />
                </div>

                {selectedFranchise.notes && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes existantes</label>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-line">
                      {selectedFranchise.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={addFranchiseNote}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Ajouter la note
                </button>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 