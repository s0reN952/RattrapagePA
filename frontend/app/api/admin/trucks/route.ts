import { NextRequest, NextResponse } from 'next/server';

// GET - Récupérer tous les camions
export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:3001/admin/trucks', {
      headers: {
        'Authorization': `Bearer ${getTokenFromRequest(request)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de la récupération des camions' },
        { status: response.status }
      );
    }

    const trucks = await response.json();
    return NextResponse.json(trucks);
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau camion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation basique
    if (!body.nom || body.nom.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du camion est requis' },
        { status: 400 }
      );
    }

    const response = await fetch('http://localhost:3001/admin/trucks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getTokenFromRequest(request)}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de la création du camion' },
        { status: response.status }
      );
    }

    const newTruck = await response.json();
    return NextResponse.json(newTruck, { status: 201 });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// Fonction helper pour récupérer le token
function getTokenFromRequest(request: NextRequest): string {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return '';
} 