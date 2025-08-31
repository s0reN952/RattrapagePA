const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des pages avec useSearchParams...');

function fixSearchParamsPage(filePath) {
  console.log(`Correction de: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si la page utilise useSearchParams
  if (content.includes('useSearchParams')) {
    console.log(`  📍 Page utilise useSearchParams, ajout de Suspense...`);
    
    // Ajouter Suspense à l'import
    if (!content.includes('Suspense')) {
      content = content.replace(
        /import \{ ([^}]+) \} from 'react';/g,
        'import { $1, Suspense } from \'react\';'
      );
    }
    
    // Trouver le composant principal
    const mainComponentMatch = content.match(/export default function ([^(]+)\(/);
    if (mainComponentMatch) {
      const componentName = mainComponentMatch[1];
      console.log(`  🔧 Composant principal trouvé: ${componentName}`);
      
      // Renommer le composant principal
      content = content.replace(
        new RegExp(`export default function ${componentName}\\(`, 'g'),
        `function ${componentName}Content(`
      );
      
      // Ajouter le wrapper Suspense
      const fallbackJSX = `
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <${componentName}Content />
    </Suspense>
  );`;
      
      // Trouver la fin de la fonction et ajouter le wrapper
      const functionEnd = content.lastIndexOf('}');
      if (functionEnd !== -1) {
        content = content.substring(0, functionEnd) + fallbackJSX + '\n}';
      }
      
      // Ajouter le nouveau composant export default
      content += `

export default function ${componentName}() {
${fallbackJSX}
}`;
    }
  }
  
  // Sauvegarder
  fs.writeFileSync(filePath, content);
  console.log(`  ✅ Corrigé: ${filePath}`);
}

function findPageFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item === 'page.tsx' || item === 'page.js') {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Trouver et corriger toutes les pages
const pageFiles = findPageFiles('./app');
console.log(`📁 Vérification de ${pageFiles.length} pages`);

pageFiles.forEach(fixSearchParamsPage);

console.log('🎉 Toutes les pages ont été vérifiées !');
console.log('Maintenant vous pouvez essayer: npm run build');
