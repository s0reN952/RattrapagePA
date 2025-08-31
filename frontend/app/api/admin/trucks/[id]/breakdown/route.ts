import { NextResponse } from 'next/server';

// POST - Signaler une panne de camion
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
    
    const response = await fetch(`http://localhost:3001/admin/trucks/${truckId}/breakdown`, {
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
        { error: errorData.message || 'Erreur lors du signalement de la panne' },
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
function getTokenFromRequest(request: any): string {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return '';
}
