import { NextResponse } from 'next/server';

export async function PUT(
  request: any,
  { params }: { params: { productId: string } }
, ctx: any) {
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
    const productId = parseInt(ctx?.params?.productId);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de produit invalide' },
        { status: 400 }
      );
    }

    // Récupérer les données du body
    const body = await request.json();

    // Appeler le backend pour mettre à jour le stock
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/franchise-stock/update/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erreur lors de la mise à jour du stock' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du stock:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
