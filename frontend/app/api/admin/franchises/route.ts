import { NextRequest, NextResponse } from 'next/server';

// GET - Récupérer tous les franchisés
export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:3001/admin/franchises', {
      headers: {
        'Authorization': `Bearer ${getTokenFromRequest(request)}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des franchisés' },
        { status: response.status }
      );
    }

    const franchises = await response.json();
    return NextResponse.json(franchises);
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