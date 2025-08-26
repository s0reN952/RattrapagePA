'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Filter,
  Users,
  Truck,
  Euro,
  Warehouse,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ReportsAndStats() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fonction pour afficher un message temporaire
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Rapports et Statistiques</h1>
          <p className="text-gray-600">Gérez et téléchargez les rapports administratifs</p>
        </div>

        {/* Message de statut */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Boutons de téléchargement uniquement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📁 Télécharger les rapports</h3>
          <p className="text-gray-600 mb-6">
            Téléchargez directement les derniers rapports générés depuis le serveur.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Téléchargement rapport mensuel */}
            <div className="text-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="mb-4">
                <FileText className="w-16 h-16 text-blue-600 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Rapport mensuel</h4>
              <p className="text-gray-600 mb-4">Télécharger le dernier rapport mensuel généré</p>
              <button
                onClick={() => {
                  // Télécharger le dernier rapport mensuel via l'API
                  const token = localStorage.getItem('token');
                  if (token) {
                    // D'abord, récupérer la liste des rapports pour trouver le plus récent
                    fetch('/api/admin/reports/list', {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    })
                    .then(response => response.json())
                    .then(data => {
                      const monthlyReports = data.reports?.filter((r: any) => r.type === 'monthly') || [];
                      if (monthlyReports.length > 0) {
                        // Prendre le plus récent et télécharger via l'API
                        const latest = monthlyReports[0];
                        
                        // Télécharger directement via fetch avec le token
                        fetch(`/api/admin/reports/download/${latest.filename}`, {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        })
                        .then(response => {
                          if (response.ok) {
                            return response.blob();
                          }
                          throw new Error('Erreur lors du téléchargement');
                        })
                        .then(blob => {
                          // Créer un lien de téléchargement avec le blob
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = latest.filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        })
                        .catch(error => {
                          console.error('Erreur lors du téléchargement:', error);
                          showMessage('error', 'Erreur lors du téléchargement du rapport');
                        });
                      } else {
                        showMessage('error', 'Aucun rapport mensuel disponible. Générez-en un d\'abord !');
                      }
                    })
                    .catch(error => {
                      console.error('Erreur:', error);
                      showMessage('error', 'Erreur lors de la récupération des rapports');
                    });
                  }
                }}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                Télécharger mensuel
              </button>
            </div>
            
            {/* Téléchargement rapport trimestriel */}
            <div className="text-center p-6 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <div className="mb-4">
                <BarChart3 className="w-16 h-16 text-purple-600 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Rapport trimestriel</h4>
              <p className="text-gray-600 mb-4">Télécharger le dernier rapport trimestriel généré</p>
              <button
                onClick={() => {
                  // Télécharger le dernier rapport trimestriel via l'API
                  const token = localStorage.getItem('token');
                  if (token) {
                    // D'abord, récupérer la liste des rapports pour trouver le plus récent
                    fetch('/api/admin/reports/list', {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    })
                    .then(response => response.json())
                    .then(data => {
                      const quarterlyReports = data.reports?.filter((r: any) => r.type === 'quarterly') || [];
                      if (quarterlyReports.length > 0) {
                        // Prendre le plus récent et télécharger via l'API
                        const latest = quarterlyReports[0];
                        
                        // Télécharger directement via fetch avec le token
                        fetch(`/api/admin/reports/download/${latest.filename}`, {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        })
                        .then(response => {
                          if (response.ok) {
                            return response.blob();
                          }
                          throw new Error('Erreur lors du téléchargement');
                        })
                        .then(blob => {
                          // Créer un lien de téléchargement avec le blob
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = latest.filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        })
                        .catch(error => {
                          console.error('Erreur lors du téléchargement:', error);
                          showMessage('error', 'Erreur lors du téléchargement du rapport');
                        });
                      } else {
                        showMessage('error', 'Aucun rapport trimestriel disponible. Générez-en un d\'abord !');
                      }
                    })
                    .catch(error => {
                      console.error('Erreur:', error);
                      showMessage('error', 'Erreur lors de la récupération des rapports');
                    });
                  }
                }}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                Télécharger trimestriel
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                // Afficher les informations sur le dossier des rapports
                showMessage('success', 'Les rapports sont sauvegardés dans le dossier backend/reports/ sur le serveur. Utilisez les boutons de téléchargement ci-dessus pour récupérer les rapports directement.');
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Informations sur le dossier des rapports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 