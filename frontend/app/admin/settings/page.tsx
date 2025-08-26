'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  Save,
  Eye,
  EyeOff,
  Key,
  UserPlus
} from 'lucide-react';

interface AdminUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
}

interface SystemSettings {
  companyName: string;
  entryFee: number;
  commissionRate: number;
  mandatoryPurchaseRate: number;
  maintenanceInterval: number;
  lowStockThreshold: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function AdminSettings() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: 'Driv\'n Cook',
    entryFee: 50000,
    commissionRate: 4,
    mandatoryPurchaseRate: 80,
    maintenanceInterval: 30,
    lowStockThreshold: 10,
    emailNotifications: true,
    smsNotifications: false
  });
  const [loading, setLoading] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdmin)
      });

      if (response.ok) {
        fetchAdminUsers();
        setShowCreateAdmin(false);
        setNewAdmin({
          nom: '',
          prenom: '',
          email: '',
          password: '',
          role: 'admin'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'admin:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      // Ici vous pourriez implémenter la sauvegarde des paramètres
      console.log('Paramètres sauvegardés:', systemSettings);
      
      // Simulation de sauvegarde
      setTimeout(() => {
        alert('Paramètres sauvegardés avec succès !');
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
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
              <h1 className="text-3xl font-bold text-gray-900">Paramètres d'administration</h1>
              <p className="text-gray-600">Configuration du système et gestion des accès</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={saveSettings}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Paramètres système */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 ml-3">Paramètres généraux</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={systemSettings.companyName}
                    onChange={(e) => setSystemSettings({...systemSettings, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Droit d'entrée (€)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.entryFee}
                      onChange={(e) => setSystemSettings({...systemSettings, entryFee: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taux de commission (%)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.commissionRate}
                      onChange={(e) => setSystemSettings({...systemSettings, commissionRate: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Achats obligatoires (%)
                    </label>
                    <input
                      type="number"
                      value={systemSettings.mandatoryPurchaseRate}
                      onChange={(e) => setSystemSettings({...systemSettings, mandatoryPurchaseRate: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seuil stock faible
                    </label>
                    <input
                      type="number"
                      value={systemSettings.lowStockThreshold}
                      onChange={(e) => setSystemSettings({...systemSettings, lowStockThreshold: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 ml-3">Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Notifications par email</p>
                    <p className="text-sm text-gray-600">Alertes et rapports par email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.emailNotifications}
                      onChange={(e) => setSystemSettings({...systemSettings, emailNotifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Notifications SMS</p>
                    <p className="text-sm text-gray-600">Alertes urgentes par SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.smsNotifications}
                      onChange={(e) => setSystemSettings({...systemSettings, smsNotifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Gestion des administrateurs */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 ml-3">Administrateurs</h3>
                </div>
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {adminUsers.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {admin.prenom} {admin.nom}
                        </p>
                        <p className="text-xs text-gray-600">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {admin.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sécurité */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Key className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 ml-3">Sécurité</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalle de maintenance (jours)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.maintenanceInterval}
                    onChange={(e) => setSystemSettings({...systemSettings, maintenanceInterval: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Shield className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        Recommandations de sécurité
                      </h4>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Changer les mots de passe tous les 90 jours</li>
                          <li>Activer l'authentification à deux facteurs</li>
                          <li>Surveiller les connexions suspectes</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création d'admin */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Créer un nouvel administrateur
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={newAdmin.prenom}
                    onChange={(e) => setNewAdmin({...newAdmin, prenom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={newAdmin.nom}
                    onChange={(e) => setNewAdmin({...newAdmin, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Administrateur</option>
                    <option value="super_admin">Super Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateAdmin(false);
                    setNewAdmin({
                      nom: '',
                      prenom: '',
                      email: '',
                      password: '',
                      role: 'admin'
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={createAdmin}
                  disabled={!newAdmin.prenom || !newAdmin.nom || !newAdmin.email || !newAdmin.password}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 