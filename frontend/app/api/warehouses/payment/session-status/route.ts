import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID requis' },
        { status: 400 }
      );
    }

    // Appeler le backend pour vérifier le statut de la session
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/warehouses/payment/session-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de la session:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
