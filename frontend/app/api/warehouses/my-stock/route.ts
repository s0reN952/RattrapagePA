import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Appeler l'API backend pour récupérer le stock personnel
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendBaseUrl}/franchise-stock/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!backendResponse.ok) {
      throw new Error(`Erreur backend: ${backendResponse.status}`);
    }

    const stockData = await backendResponse.json();

    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedStock = stockData.map((item: any) => ({
      id: item.id,
      quantite: item.quantite,
      prixUnitaire: item.product?.prix || 0,
      prixTotal: (item.product?.prix || 0) * item.quantite,
      notes: item.notes || '',
      dateExpiration: item.datePeremption || null,
      isExpired: item.datePeremption ? new Date(item.datePeremption) < new Date() : false,
      product: {
        id: item.product?.id,
        nom: item.product?.nom || 'Produit inconnu',
        prix: item.product?.prix || 0,
        stock: item.quantite,
        category: item.product?.category || 'ingredient'
      }
    }));

    return NextResponse.json(transformedStock);
  } catch (error) {
    console.error('Erreur lors de la récupération du stock personnel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du stock personnel' },
      { status: 500 }
    );
  }
}
