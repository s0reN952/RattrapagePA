import { NextResponse } from 'next/server';

export async function GET(request: any, ctx: any) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typePeriode = searchParams.get('typePeriode') || 'monthly';

    const response = await fetch(`http://localhost:3001/admin/compliance/overview?typePeriode=${typePeriode}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Erreur serveur' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur API conformité:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
