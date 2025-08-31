import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function PUT(
  request: any,
  { params }: { params: { id: string } }
, ctx: any) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/warehouses/admin/products/${ctx?.params?.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la modification du produit');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du produit' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: any,
  { params }: { params: { id: string } }
, ctx: any) {
  try {
    const token = request.headers.get('authorization');
    
    const response = await fetch(`${BACKEND_URL}/warehouses/admin/products/${ctx?.params?.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du produit');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du produit' },
      { status: 500 }
    );
  }
}
