import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    console.log(`[Product API] GET - Tentative de connexion à: ${BACKEND_URL}/warehouses/admin/products`);
    
    const response = await fetch(`${BACKEND_URL}/warehouses/admin/products`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    });

    console.log(`[Product API] GET - Réponse du backend: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Product API] GET - Erreur backend: ${response.status} - ${errorText}`);
      throw new Error(`Erreur backend: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Product API] GET - Données reçues:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Product API] GET - Erreur complète:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Impossible de se connecter au serveur backend. Vérifiez qu\'il est démarré sur le port 3001.' },
        { status: 503 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur lors de la récupération des produits: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    
    console.log(`[Product API] POST - Tentative de connexion à: ${BACKEND_URL}/warehouses/admin/products`);
    console.log(`[Product API] POST - Données envoyées:`, body);
    
    const response = await fetch(`${BACKEND_URL}/warehouses/admin/products`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Product API] POST - Réponse du backend: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Product API] POST - Erreur backend: ${response.status} - ${errorText}`);
      throw new Error(`Erreur backend: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Product API] POST - Données reçues:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Product API] POST - Erreur complète:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Impossible de se connecter au serveur backend. Vérifiez qu\'il est démarré sur le port 3001.' },
        { status: 500 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur lors de la création du produit: ${errorMessage}` },
      { status: 500 }
    );
  }
}
