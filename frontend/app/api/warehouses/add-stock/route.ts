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

    const body = await request.json();
    const { productId, quantity, emplacement, notes } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'productId et quantity sont requis' },
        { status: 400 }
      );
    }

    // Appeler l'API backend pour ajouter au stock personnel
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/franchise-stock/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId,
        quantity,
        emplacement: emplacement || 'frigo',
        notes: notes || `Ajout manuel du ${new Date().toLocaleDateString('fr-FR')}`
      })
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de l\'ajout au stock personnel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout au stock personnel' },
      { status: 500 }
    );
  }
}
