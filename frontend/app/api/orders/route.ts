import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Appeler le backend pour récupérer les commandes de l'utilisateur
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/orders/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors du chargement des commandes' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const body = await request.json();

    // Validation des données
    if (!body.warehouseId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Données de commande invalides' },
        { status: 400 }
      );
    }

    // Appeler le backend pour créer la commande
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de la création de la commande' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
