import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: any, ctx: any) {
  try {
    const token = request.headers.get('authorization');
    
    console.log(`[Warehouse API] GET - Tentative de connexion à: ${BACKEND_URL}/warehouses/admin/warehouses`);
    
    const response = await fetch(`${BACKEND_URL}/warehouses/admin/warehouses`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    });

    console.log(`[Warehouse API] GET - Réponse du backend: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Warehouse API] GET - Erreur backend: ${response.status} - ${errorText}`);
      throw new Error(`Erreur backend: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Warehouse API] GET - Données reçues:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Warehouse API] GET - Erreur complète:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Impossible de se connecter au serveur backend. Vérifiez qu\'il est démarré sur le port 3001.' },
        { status: 503 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur lors de la récupération des entrepôts: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: any, ctx: any) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    
    console.log(`[Warehouse API] POST - Tentative de connexion à: ${BACKEND_URL}/warehouses/admin/warehouses`);
    console.log(`[Warehouse API] POST - Données envoyées:`, body);
    
    const response = await fetch(`${BACKEND_URL}/warehouses/admin/warehouses`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Warehouse API] POST - Réponse du backend: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Warehouse API] POST - Erreur backend: ${response.status} - ${errorText}`);
      throw new Error(`Erreur backend: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Warehouse API] POST - Données reçues:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Warehouse API] POST - Erreur complète:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Impossible de se connecter au serveur backend. Vérifiez qu\'il est démarré sur le port 3001.' },
        { status: 503 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur lors de la création de l'entrepôt: ${errorMessage}` },
      { status: 500 }
    );
  }
}
