import { NextRequest, NextResponse } from 'next/server';

// POST - Attribuer un camion à un franchisé
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; franchiseId: string } }
) {
  try {
    const truckId = parseInt(params.id);
    const franchiseId = parseInt(params.franchiseId);

    if (isNaN(truckId) || isNaN(franchiseId)) {
      return NextResponse.json(
        { error: 'ID de camion ou de franchisé invalide' },
        { status: 400 }
      );
    }

    const response = await fetch(`http://localhost:3001/admin/trucks/${truckId}/assign/${franchiseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getTokenFromRequest(request)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de l\'attribution du camion' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
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