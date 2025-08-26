import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const truckId = parseInt(params.id);
    if (isNaN(truckId)) {
      return NextResponse.json(
        { error: 'ID de camion invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { panneResolution, maintenanceNotes } = body;

    if (!panneResolution) {
      return NextResponse.json(
        { error: 'Description de la résolution requise' },
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
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/admin/trucks/${truckId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        panneResolution,
        maintenanceNotes
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de la résolution du problème' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur lors de la résolution du problème:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
