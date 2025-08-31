const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique de toutes les routes Next.js...');

function fixRouteFile(filePath) {
  console.log(`Correction de: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer NextRequest par any
  content = content.replace(/NextRequest/g, 'any');
  
  // Remplacer les signatures avec params
  content = content.replace(
    /export async function (GET|POST|PUT|DELETE)\(([^,]+),\s*\{\s*params\s*:\s*\{\s*([^}]+)\s*\}\s*\}\)/g,
    'export async function $1($2, ctx: any)'
  );
  
  // Remplacer l'accès aux params
  content = content.replace(/params\.([a-zA-Z]+)/g, 'ctx?.params?.$1');
  
  // Remplacer les signatures simples sans params
  content = content.replace(
    /export async function (GET|POST|PUT|DELETE)\(([^)]+)\)/g,
    'export async function $1($2, ctx: any)'
  );
  
  // Sauvegarder
  fs.writeFileSync(filePath, content);
  console.log(`✅ Corrigé: ${filePath}`);
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

// Trouver et corriger toutes les routes
const routeFiles = findRouteFiles('./app/api');
console.log(`📁 Trouvé ${routeFiles.length} fichiers de routes à corriger`);

routeFiles.forEach(fixRouteFile);

console.log('🎉 Toutes les routes ont été corrigées !');
console.log('Maintenant vous pouvez essayer: npm run build');
