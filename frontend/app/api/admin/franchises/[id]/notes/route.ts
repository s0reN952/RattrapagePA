import { NextRequest, NextResponse } from 'next/server';

// POST - Ajouter une note à un franchisé
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const franchiseId = parseInt(params.id);

    if (isNaN(franchiseId)) {
      return NextResponse.json(
        { error: 'ID de franchisé invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(`http://localhost:3001/admin/franchises/${franchiseId}/notes`, {
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
        { error: errorData.message || 'Erreur lors de l\'ajout de la note' },
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
