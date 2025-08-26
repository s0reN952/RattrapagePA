"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Truck {
  id: number;
  nom: string;
  statut: 'en_service' | 'en_panne' | 'entretien' | 'hors_service';
  isAssigned: boolean;
  assignedAt?: string;
  emplacement?: string;
  zone?: string;
  kilometrage?: number;
  niveauCarburant?: 'A' | 'B' | 'C' | 'D' | 'E';
  lastMaintenance?: string;
  nextMaintenance?: string;
}

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [problemData, setProblemData] = useState({
    panneDescription: '',
    emplacement: '',
    zone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadTrucks();
  }, [router]);

  const loadTrucks = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3001/trucks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setTrucks(data);
    } catch (err) {
      setError("Erreur lors du chargement des camions");
    } finally {
      setLoading(false);
    }
  };

  const reportProblem = async () => {
    if (!selectedTruck || !problemData.panneDescription.trim()) {
      setError("Veuillez décrire le problème");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/trucks/${selectedTruck.id}/report-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(problemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du signalement du problème');
      }

      setSuccess('Problème signalé avec succès ! L\'équipe technique a été notifiée.');
      setShowProblemModal(false);
      setProblemData({ panneDescription: '', emplacement: '', zone: '' });
      setSelectedTruck(null);
      
      // Recharger les camions pour mettre à jour le statut
      loadTrucks();
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du signalement du problème');
    } finally {
      setSubmitting(false);
    }
  };

  const openProblemModal = (truck: Truck) => {
    setSelectedTruck(truck);
    setProblemData({
      panneDescription: '',
      emplacement: truck.emplacement || '',
      zone: truck.zone || ''
    });
    setShowProblemModal(true);
    setError("");
    setSuccess("");
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_service': return 'text-green-600 bg-green-100';
      case 'en_panne': return 'text-red-600 bg-red-100';
      case 'entretien': return 'text-yellow-600 bg-yellow-100';
      case 'hors_service': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFuelLevelColor = (niveau: string) => {
    switch (niveau) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-yellow-600';
      case 'C': return 'text-orange-600';
      case 'D': return 'text-red-600';
      case 'E': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des camions...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🚛 Mes Camions</h1>
          <p className="text-gray-600 mt-2">Consultation de vos camions attribués</p>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Messages de succès */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✅ {success}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{trucks.length}</div>
            <div className="text-gray-600">Total Camions</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {trucks.filter(t => t.statut === 'en_service').length}
            </div>
            <div className="text-gray-600">En Service</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {trucks.filter(t => t.statut === 'entretien').length}
            </div>
            <div className="text-gray-600">En Entretien</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {trucks.filter(t => t.statut === 'en_panne').length}
            </div>
            <div className="text-gray-600">En Panne</div>
          </div>
        </div>

        {/* Liste des camions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Liste de vos Camions</h2>
          </div>
          <div className="overflow-x-auto">
            {trucks.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <p className="text-lg">Aucun camion attribué</p>
                <p className="text-sm mt-2">Contactez l'administrateur pour obtenir un camion</p>
              </div>
            ) : (
              <div className="grid gap-6 p-6">
                {trucks.map((truck) => (
                  <div key={truck.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{truck.nom}</h3>
                        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(truck.statut)}`}>
                          {truck.statut === 'en_service' && '🟢 En Service'}
                          {truck.statut === 'en_panne' && '🔴 En Panne'}
                          {truck.statut === 'entretien' && '🟡 En Entretien'}
                          {truck.statut === 'hors_service' && '⚫ Hors Service'}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>Attribué le: {truck.assignedAt ? new Date(truck.assignedAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations de base */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Informations Générales</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Statut:</span>
                            <span className="font-medium">{truck.statut}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attribué:</span>
                            <span className="font-medium">{truck.isAssigned ? 'Oui' : 'Non'}</span>
                          </div>
                          {truck.emplacement && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Emplacement:</span>
                              <span className="font-medium">{truck.emplacement}</span>
                            </div>
                          )}
                          {truck.zone && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Zone:</span>
                              <span className="font-medium">{truck.zone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informations techniques */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Informations Techniques</h4>
                        <div className="space-y-2 text-sm">
                          {truck.kilometrage !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Kilométrage:</span>
                              <span className="font-medium">{truck.kilometrage.toLocaleString('fr-FR')} km</span>
                            </div>
                          )}
                          {truck.niveauCarburant && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Carburant:</span>
                              <span className={`font-medium ${getFuelLevelColor(truck.niveauCarburant)}`}>
                                {truck.niveauCarburant === 'A' && '🟢 Plein'}
                                {truck.niveauCarburant === 'B' && '🟡 3/4'}
                                {truck.niveauCarburant === 'C' && '🟠 1/2'}
                                {truck.niveauCarburant === 'D' && '🔴 1/4'}
                                {truck.niveauCarburant === 'E' && '⚫ Réservoir'}
                              </span>
                            </div>
                          )}
                          {truck.lastMaintenance && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dernière maintenance:</span>
                              <span className="font-medium">{new Date(truck.lastMaintenance).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                          {truck.nextMaintenance && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Prochaine maintenance:</span>
                              <span className="font-medium">{new Date(truck.nextMaintenance).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex gap-3">
                        <button 
                          className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          onClick={() => openProblemModal(truck)}
                        >
                          🚨 Signaler un problème
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de signalement de problème */}
      {showProblemModal && selectedTruck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">🚨</span>
                Signaler un problème - {selectedTruck.nom}
              </h3>
              <p className="text-red-100 mt-1">Décrivez le problème rencontré avec votre camion</p>
            </div>

            <div className="p-6">
              {/* Messages d'erreur et de succès */}
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-400 text-xl">❌</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-green-400 text-xl">✅</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={(e) => { e.preventDefault(); reportProblem(); }} className="space-y-6">
                {/* Description du problème */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🚨 Description du problème *
                  </label>
                  <textarea
                    value={problemData.panneDescription}
                    onChange={(e) => setProblemData({ ...problemData, panneDescription: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-colors"
                    rows={4}
                    placeholder="Décrivez en détail le problème rencontré (ex: moteur qui tousse, freins qui grincent, etc.)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Soyez le plus précis possible pour faciliter l'intervention de l'équipe technique
                  </p>
                </div>

                {/* Emplacement actuel */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Emplacement actuel
                  </label>
                  <input
                    type="text"
                    value={problemData.emplacement}
                    onChange={(e) => setProblemData({ ...problemData, emplacement: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    placeholder="Adresse ou lieu où se trouve le camion"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Indiquez où se trouve le camion pour faciliter l'intervention
                  </p>
                </div>

                {/* Zone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🗺️ Zone
                  </label>
                  <select
                    value={problemData.zone}
                    onChange={(e) => setProblemData({ ...problemData, zone: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  >
                    <option value="">Sélectionnez une zone</option>
                    <option value="Paris Centre">Paris Centre</option>
                    <option value="Paris Nord">Paris Nord</option>
                    <option value="Paris Sud">Paris Sud</option>
                    <option value="Paris Est">Paris Est</option>
                    <option value="Paris Ouest">Paris Ouest</option>
                    <option value="Banlieue Nord">Banlieue Nord</option>
                    <option value="Banlieue Sud">Banlieue Sud</option>
                    <option value="Banlieue Est">Banlieue Est</option>
                    <option value="Banlieue Ouest">Banlieue Ouest</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Zone géographique pour organiser l'intervention
                  </p>
                </div>

                {/* Informations sur le camion */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Informations sur le camion</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nom:</span>
                      <span className="font-medium ml-2">{selectedTruck.nom}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Statut actuel:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTruck.statut)}`}>
                        {selectedTruck.statut}
                      </span>
                    </div>
                    {selectedTruck.kilometrage !== undefined && (
                      <div>
                        <span className="text-gray-600">Kilométrage:</span>
                        <span className="font-medium ml-2">{selectedTruck.kilometrage.toLocaleString('fr-FR')} km</span>
                      </div>
                    )}
                    {selectedTruck.niveauCarburant && (
                      <div>
                        <span className="text-gray-600">Carburant:</span>
                        <span className="font-medium ml-2">{selectedTruck.niveauCarburant}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting || !problemData.panneDescription.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🚨</span>
                        Signaler le problème
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProblemModal(false);
                      setSelectedTruck(null);
                      setProblemData({ panneDescription: '', emplacement: '', zone: '' });
                      setError("");
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
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