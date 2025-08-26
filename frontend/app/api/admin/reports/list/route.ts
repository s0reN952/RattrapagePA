import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const response = await fetch('http://localhost:3001/admin/reports/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des rapports');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la récupération des rapports' },
      { status: 500 }
    );
  }
}
