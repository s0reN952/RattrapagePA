import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    console.log('=== DÉBUT API ROUTE TÉLÉCHARGEMENT ===');
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.error('❌ Token manquant dans la requête');
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const filename = params.filename;
    console.log('📁 Fichier demandé:', filename);
    console.log('🔑 Token reçu:', token.substring(0, 20) + '...');
    
    const backendUrl = `http://localhost:3001/admin/reports/download/${filename}`;
    console.log('🌐 URL backend:', backendUrl);
    
    console.log('📡 Appel du backend...');
    
    // Appeler le backend avec le token pour récupérer le fichier
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Réponse backend reçue:', response.status, response.statusText);
    console.log('📋 Headers de réponse:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur backend complète:', errorText);
      throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
    }

    console.log('✅ Réponse backend OK, récupération du fichier...');
    
    // Récupérer le contenu du fichier
    const fileBuffer = await response.arrayBuffer();
    console.log('📄 Fichier récupéré, taille:', fileBuffer.byteLength, 'bytes');
    
    console.log('🚀 Envoi du fichier au frontend...');
    
    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('💥 Erreur complète lors du téléchargement:', error);
    return NextResponse.json(
      { error: `Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  } finally {
    console.log('=== FIN API ROUTE TÉLÉCHARGEMENT ===');
  }
}
