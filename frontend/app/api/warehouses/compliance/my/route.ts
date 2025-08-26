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

    // Appeler le backend pour récupérer la conformité
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/warehouses/compliance/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors du chargement de la conformité' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur lors du chargement de la conformité:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
