#!/bin/bash

# Script de configuration pour la production
echo "Configuration de l'environnement de production..."

# Créer le fichier .env.production
cat > .env.production << EOF
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=appuser
DB_PASSWORD=motdepasse
DB_DATABASE=appdb

# Frontend URL for production
FRONTEND_URL=https://votre-domaine.com

# JWT Secret (à changer en production)
JWT_SECRET=votre-secret-jwt-super-securise

# Stripe Keys (à configurer selon votre environnement)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EOF

echo "Fichier .env.production créé"
echo "N'oubliez pas de :"
echo "1. Modifier FRONTEND_URL avec votre vrai domaine"
echo "2. Configurer vos vraies clés Stripe"
echo "3. Changer JWT_SECRET"
echo "4. Copier ce fichier vers votre serveur de production"
