# Script pour corriger automatiquement les routes Next.js 15.4.4
Write-Host "🔧 Correction automatique des routes Next.js..." -ForegroundColor Yellow

# Fonction pour corriger un fichier
function Fix-RouteFile {
    param([string]$filePath)
    
    Write-Host "Correction de: $filePath" -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    
    # Remplacer NextRequest par Request
    $content = $content -replace 'NextRequest', 'Request'
    
    # Remplacer les signatures de fonctions avec params
    $content = $content -replace 'export async function (GET|POST|PUT|DELETE)\(([^,]+),\s*\{\s*params\s*:\s*\{\s*([^}]+)\s*\}\s*\}\)', 'export async function $1($2, ctx: any)'
    
    # Remplacer l'accès aux params
    $content = $content -replace 'params\.([a-zA-Z]+)', 'ctx?.params?.$1'
    
    # Remplacer les signatures simples
    $content = $content -replace 'export async function (GET|POST|PUT|DELETE)\(([^)]+)\)', 'export async function $1($2, ctx: any)'
    
    # Sauvegarder le fichier
    Set-Content $filePath $content -NoNewline
    Write-Host "✅ Corrigé: $filePath" -ForegroundColor Green
}

# Trouver tous les fichiers de routes
$routeFiles = Get-ChildItem -Path "app/api" -Recurse -Filter "route.ts"

Write-Host "📁 Trouvé $($routeFiles.Count) fichiers de routes à corriger" -ForegroundColor Blue

foreach ($file in $routeFiles) {
    Fix-RouteFile $file.FullName
}

Write-Host "🎉 Toutes les routes ont été corrigées !" -ForegroundColor Green
Write-Host "Maintenant vous pouvez essayer: npm run build" -ForegroundColor Yellow
