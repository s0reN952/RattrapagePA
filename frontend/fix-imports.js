const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des imports cassés...');

function fixImports(filePath) {
  console.log(`Correction des imports de: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Corriger les imports cassés
  content = content.replace(/import \{ any, NextResponse \} from 'next\/server';/g, "import { NextResponse } from 'next/server';");
  content = content.replace(/import \{ NextResponse, any \} from 'next\/server';/g, "import { NextResponse } from 'next/server';");
  
  // Sauvegarder
  fs.writeFileSync(filePath, content);
  console.log(`✅ Imports corrigés: ${filePath}`);
}

function findRouteFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Trouver et corriger tous les fichiers
const routeFiles = findRouteFiles('./app/api');
console.log(`📁 Vérification de ${routeFiles.length} fichiers de routes`);

routeFiles.forEach(fixImports);

console.log('🎉 Tous les imports ont été corrigés !');
console.log('Maintenant vous pouvez essayer: npm run build');
