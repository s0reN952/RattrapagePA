import { NextRequest, NextResponse } from 'next/server';

// PUT - Mettre à jour le statut de maintenance d'un camion
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const truckId = parseInt(params.id);
    const body = await request.json();

    const response = await fetch(`http://localhost:3001/admin/trucks/${truckId}/maintenance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getTokenFromRequest(request)}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du statut' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
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