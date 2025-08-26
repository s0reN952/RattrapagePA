"use client";
import { useState, useEffect } from 'react';

interface Truck {
  id: number;
  nom: string;
  statut: 'en_service' | 'en_panne' | 'entretien' | 'hors_service';
  isAssigned: boolean;
  assignedAt?: string;
  emplacement?: string;
  zone?: string;
  panneDescription?: string;
  panneDate?: string;
  panneResolution?: string;
  panneResolvedAt?: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
}

interface Franchise {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  isActive: boolean;
}

export default function AdminTrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [eligibleFranchises, setEligibleFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [newTruck, setNewTruck] = useState({ nom: '', statut: 'en_service' as const });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showResolveProblemModal, setShowResolveProblemModal] = useState(false);
  const [problemResolution, setProblemResolution] = useState({
    panneResolution: '',
    maintenanceNotes: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTrucks();
    fetchEligibleFranchises();
  }, []);

  const fetchTrucks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/trucks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTrucks(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du chargement des camions');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des camions:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleFranchises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/franchises/eligible-for-truck', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEligibleFranchises(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des franchisés éligibles:', error);
    }
  };

  const createTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/trucks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTruck)
      });

      if (response.ok) {
        setSuccess('Camion créé avec succès !');
        setNewTruck({ nom: '', statut: 'en_service' });
        setShowCreateForm(false);
        fetchTrucks();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la création du camion');
      }
    } catch (error) {
      console.error('Erreur lors de la création du camion:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const assignTruck = async () => {
    if (!selectedTruck || !selectedFranchise) {
      setError('Veuillez sélectionner un camion et un franchisé');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/trucks/${selectedTruck.id}/assign/${selectedFranchise.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('Camion attribué avec succès !');
        setShowAssignForm(false);
        setSelectedTruck(null);
        setSelectedFranchise(null);
        fetchTrucks();
        fetchEligibleFranchises();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'attribution du camion');
      }
    } catch (error) {
      console.error('Erreur lors de l\'attribution du camion:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const unassignTruck = async (truckId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce camion au franchisé ?')) return;

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/trucks/${truckId}/unassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('Camion retiré avec succès !');
        fetchTrucks();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du retrait du camion');
      }
    } catch (error) {
      console.error('Erreur lors du retrait du camion:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const resolveProblem = async () => {
    if (!selectedTruck || !problemResolution.panneResolution.trim()) {
      setError("Veuillez décrire la résolution du problème");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/trucks/${selectedTruck.id}/resolve-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(problemResolution),
      });

      if (response.ok) {
        setSuccess('Problème résolu avec succès ! Le camion est remis en service.');
        setShowResolveProblemModal(false);
        setProblemResolution({ panneResolution: '', maintenanceNotes: '' });
        setSelectedTruck(null);
        fetchTrucks();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la résolution du problème');
      }
    } catch (error) {
      console.error('Erreur lors de la résolution du problème:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const openResolveProblemModal = (truck: Truck) => {
    setSelectedTruck(truck);
    setProblemResolution({
      panneResolution: '',
      maintenanceNotes: ''
    });
    setShowResolveProblemModal(true);
    setError("");
    setSuccess("");
  };

  const updateStatus = async (truckId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/trucks/${truckId}/maintenance`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatus })
      });

      if (response.ok) {
        fetchTrucks();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const availableTrucks = trucks.filter(t => !t.isAssigned);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des camions...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">🚛 Gestion du Parc de Camions</h1>
          <p className="text-gray-600 mt-2">Administration du parc de camions Driv'n Cook</p>
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

        {/* Boutons d'action */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Nouveau Camion
          </button>
          <button
            onClick={() => setShowAssignForm(true)}
            disabled={availableTrucks.length === 0 || eligibleFranchises.length === 0}
            className={`px-6 py-3 rounded-lg transition-colors ${
              availableTrucks.length === 0 || eligibleFranchises.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            🚚 Attribuer un Camion
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{trucks.length}</div>
            <div className="text-gray-600">Total Camions</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{availableTrucks.length}</div>
            <div className="text-gray-600">Disponibles</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{trucks.filter(t => t.statut === 'entretien').length}</div>
            <div className="text-gray-600">En Maintenance</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{trucks.filter(t => t.statut === 'en_panne').length}</div>
            <div className="text-gray-600">En Panne</div>
          </div>
        </div>

        {/* Liste des camions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Parc de Camions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Camion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attribution</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franchisé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problèmes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trucks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun camion dans le parc pour le moment
                    </td>
                  </tr>
                ) : (
                  trucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{truck.nom}</div>
                        <div className="text-sm text-gray-500">ID: {truck.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={truck.statut}
                          onChange={(e) => updateStatus(truck.id, e.target.value)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            truck.statut === 'en_service' ? 'bg-green-100 text-green-800' :
                            truck.statut === 'entretien' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="en_service">En service</option>
                          <option value="entretien">Maintenance</option>
                          <option value="en_panne">En panne</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          truck.isAssigned ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {truck.isAssigned ? 'Attribué' : 'Disponible'}
                        </span>
                        {truck.assignedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(truck.assignedAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {truck.user ? (
                          <div>
                            <div className="font-medium">{truck.user.prenom} {truck.user.nom}</div>
                            <div className="text-sm text-gray-500">{truck.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Aucun franchisé</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {truck.statut === 'en_panne' && truck.panneDescription ? (
                          <div className="space-y-2">
                            <div className="text-sm text-red-600 font-medium">
                              🚨 Problème signalé
                            </div>
                            <div className="text-xs text-gray-600 bg-red-50 p-2 rounded">
                              {truck.panneDescription}
                            </div>
                            {truck.panneDate && (
                              <div className="text-xs text-gray-500">
                                Signalé le: {new Date(truck.panneDate).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                            {truck.emplacement && (
                              <div className="text-xs text-gray-500">
                                📍 {truck.emplacement}
                              </div>
                            )}
                            {truck.zone && (
                              <div className="text-xs text-gray-500">
                                🗺️ {truck.zone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Aucun problème</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {truck.isAssigned ? (
                            <button
                              onClick={() => unassignTruck(truck.id)}
                              className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              🚫 Retirer
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTruck(truck);
                                setShowAssignForm(true);
                              }}
                              className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              🚚 Attribuer
                            </button>
                          )}
                          {truck.statut === 'en_panne' && truck.panneDescription && (
                            <button
                              onClick={() => openResolveProblemModal(truck)}
                              className="px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              ✅ Résoudre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal création camion */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Créer un nouveau camion</h3>
              <form onSubmit={createTruck}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Nom du camion</label>
                  <input
                    type="text"
                    value={newTruck.nom}
                    onChange={(e) => setNewTruck({ ...newTruck, nom: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Ex: Camion Paris Nord 1"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Statut initial</label>
                  <select
                    value={newTruck.statut}
                    onChange={(e) => setNewTruck({ ...newTruck, statut: e.target.value as any })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="en_service">En service</option>
                    <option value="entretien">Maintenance</option>
                    <option value="en_panne">En panne</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    Créer
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal attribution camion */}
        {showAssignForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Attribuer un camion</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Camion disponible</label>
                <select 
                  className="w-full border rounded-md px-3 py-2"
                  value={selectedTruck?.id || ''}
                  onChange={(e) => {
                    const truckId = parseInt(e.target.value);
                    const truck = availableTrucks.find(t => t.id === truckId);
                    setSelectedTruck(truck || null);
                  }}
                >
                  <option value="">Choisir un camion</option>
                  {availableTrucks.map(truck => (
                    <option key={truck.id} value={truck.id}>{truck.nom}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Franchisé éligible</label>
                <select 
                  className="w-full border rounded-md px-3 py-2"
                  value={selectedFranchise?.id || ''}
                  onChange={(e) => {
                    const franchiseId = parseInt(e.target.value);
                    const franchise = eligibleFranchises.find(f => f.id === franchiseId);
                    setSelectedFranchise(franchise || null);
                  }}
                >
                  <option value="">Choisir un franchisé</option>
                  {eligibleFranchises.map(franchise => (
                    <option key={franchise.id} value={franchise.id}>
                      {franchise.prenom} {franchise.nom} ({franchise.email})
                    </option>
                  ))}
                </select>
              </div>

              {eligibleFranchises.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                  ⚠️ Aucun franchisé éligible trouvé. 
                  Les franchisés doivent avoir payé le droit d'entrée de 50 000€ et ne pas avoir de camion attribué.
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={assignTruck}
                  disabled={!selectedTruck || !selectedFranchise}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    !selectedTruck || !selectedFranchise
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Attribuer
                </button>
                <button 
                  onClick={() => {
                    setShowAssignForm(false);
                    setSelectedTruck(null);
                    setSelectedFranchise(null);
                  }} 
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de résolution des problèmes */}
      {showResolveProblemModal && selectedTruck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">✅</span>
                Résoudre le problème - {selectedTruck.nom}
              </h3>
              <p className="text-green-100 mt-1">Marquer le problème comme résolu et remettre le camion en service</p>
            </div>

            <div className="p-6">
              {/* Informations sur le problème */}
              <div className="bg-red-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                  <span className="mr-2">🚨</span>
                  Problème signalé
                </h4>
                <div className="space-y-3">
                  <div className="text-sm text-red-700">
                    <span className="font-medium">Description:</span> {selectedTruck.panneDescription}
                  </div>
                  {selectedTruck.panneDate && (
                    <div className="text-sm text-red-700">
                      <span className="font-medium">Signalé le:</span> {new Date(selectedTruck.panneDate).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  {selectedTruck.emplacement && (
                    <div className="text-sm text-red-700">
                      <span className="font-medium">Emplacement:</span> {selectedTruck.emplacement}
                    </div>
                  )}
                  {selectedTruck.zone && (
                    <div className="text-sm text-red-700">
                      <span className="font-medium">Zone:</span> {selectedTruck.zone}
                    </div>
                  )}
                  {selectedTruck.user && (
                    <div className="text-sm text-red-700">
                      <span className="font-medium">Franchisé:</span> {selectedTruck.user.prenom} {selectedTruck.user.nom}
                    </div>
                  )}
                </div>
              </div>

              {/* Formulaire de résolution */}
              <form onSubmit={(e) => { e.preventDefault(); resolveProblem(); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ✅ Description de la résolution *
                  </label>
                  <textarea
                    value={problemResolution.panneResolution}
                    onChange={(e) => setProblemResolution({ ...problemResolution, panneResolution: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                    rows={4}
                    placeholder="Décrivez comment le problème a été résolu (ex: pièce remplacée, réparation effectuée, etc.)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cette information sera enregistrée dans l'historique du camion
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔧 Notes de maintenance (optionnel)
                  </label>
                  <textarea
                    value={problemResolution.maintenanceNotes}
                    onChange={(e) => setProblemResolution({ ...problemResolution, maintenanceNotes: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    rows={3}
                    placeholder="Notes additionnelles sur la maintenance effectuée"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Informations techniques pour l'équipe de maintenance
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!problemResolution.panneResolution.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    <span className="mr-2">✅</span>
                    Marquer comme résolu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResolveProblemModal(false);
                      setSelectedTruck(null);
                      setProblemResolution({ panneResolution: '', maintenanceNotes: '' });
                      setError("");
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 