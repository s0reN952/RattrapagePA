// Configuration centralisée pour l'API
export const API_CONFIG = {
  // URL de l'API backend - utilise la variable d'environnement en production
  BACKEND_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // URL de l'API admin - peut être différente en production
  ADMIN_API_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
};

// Fonction helper pour construire les URLs de l'API
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
};

// Fonction helper pour construire les URLs de l'API admin
export const buildAdminApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.ADMIN_API_URL}${endpoint}`;
};
