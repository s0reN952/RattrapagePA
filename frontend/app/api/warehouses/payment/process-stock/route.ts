import { NextResponse } from 'next/server';

export async function POST(request: any, ctx: any) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const orderData = await request.json();

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/warehouses/payment/process-stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur lors du traitement du stock:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du stock' },
      { status: 500 }
    );
  }
}
