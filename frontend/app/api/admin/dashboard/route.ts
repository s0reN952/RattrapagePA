import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simuler des données de dashboard pour la démonstration
    const dashboardData = {
      financial: {
        totalSales: 1250000,
        totalCommissions: 50000,
        totalEntryFees: 1500000,
        totalRevenue: 1550000
      },
      franchises: {
        total: 30,
        active: 28,
        compliant: 25
      },
      trucks: {
        total: 35,
        assigned: 28,
        available: 7
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors du chargement du dashboard' },
      { status: 500 }
    );
  }
} 