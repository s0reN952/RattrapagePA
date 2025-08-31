import { NextResponse } from 'next/server';

// POST - Ajouter une note à un franchisé (version simplifiée pour Next.js 15.4.4)
export async function POST(req: any, ctx: any) {
  try {
    const { id } = ctx?.params || {};
    const franchiseId = parseInt(id);

    if (isNaN(franchiseId)) {
      return NextResponse.json(
        { error: 'ID de franchisé invalide' },
        { status: 400 }
      );
    }

    const body = await req.json();
    
    // URL simplifiée pour éviter les problèmes de configuration
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/admin/franchises/${franchiseId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getTokenFromRequest(req)}`,
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
function getTokenFromRequest(request: any): string {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return '';
}
