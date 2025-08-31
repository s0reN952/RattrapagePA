import { NextResponse } from 'next/server';

export async function POST(
  request: any,
  { params }: { params: { id: string } }
, ctx: any) {
  try {
    const truckId = parseInt(ctx?.params?.id);
    if (isNaN(truckId)) {
      return NextResponse.json(
        { error: 'ID de camion invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { panneDescription, emplacement, zone } = body;

    if (!panneDescription) {
      return NextResponse.json(
        { error: 'Description de la panne requise' },
        { status: 400 }
      );
    }

    // Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Appeler le backend
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/trucks/${truckId}/report-problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        panneDescription,
        emplacement,
        zone
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors du signalement du problème' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur lors du signalement du problème:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
