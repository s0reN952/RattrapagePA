import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const response = await fetch('http://localhost:3001/admin/reports/generate/monthly', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la génération du rapport');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors de la génération du rapport mensuel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
