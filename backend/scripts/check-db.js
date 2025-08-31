const mysql = require('mysql2/promise');

async function checkDatabaseConnection() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'appuser',
    password: process.env.DB_PASSWORD || 'motdepasse',
    database: process.env.DB_DATABASE || 'appdb'
  };

  console.log('Tentative de connexion avec la configuration:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données réussie!');
    
    // Test d'une requête simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Requête de test réussie:', rows);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    return false;
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  checkDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erreur inattendue:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseConnection };
