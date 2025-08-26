import { NextRequest, NextResponse } from 'next/server';

// GET - Récupérer les performances d'un franchisé
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const franchiseId = parseInt(params.id);
    const period = request.nextUrl.searchParams.get('period') || 'month';

    if (isNaN(franchiseId)) {
      return NextResponse.json(
        { error: 'ID de franchisé invalide' },
        { status: 400 }
      );
    }

    const response = await fetch(`http://localhost:3001/admin/franchises/${franchiseId}/performance?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${getTokenFromRequest(request)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de la récupération des performances' },
        { status: response.status }
      );
    }

    const performance = await response.json();
    return NextResponse.json(performance);
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
