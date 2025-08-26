import { NextRequest, NextResponse } from 'next/server';

// GET - Récupérer les franchisés éligibles pour l'attribution de camions
export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:3001/admin/franchises/eligible-for-truck', {
      headers: {
        'Authorization': `Bearer ${getTokenFromRequest(request)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de la récupération des franchisés éligibles' },
        { status: response.status }
      );
    }

    const franchises = await response.json();
    return NextResponse.json(franchises);
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
