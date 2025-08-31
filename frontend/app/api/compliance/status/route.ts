import { NextResponse } from 'next/server';

export async function GET(request: any, ctx: any) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    // Récupérer l'ID de l'utilisateur connecté
    const userResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des données utilisateur' }, { status: userResponse.status });
    }

    const userData = await userResponse.json();
    const franchiseId = userData.id;

    // Récupérer le statut de conformité du franchisé
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    // Récupérer les ventes du franchisé
    const salesResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/sales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!salesResponse.ok) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des ventes' }, { status: salesResponse.status });
    }

    const sales = await salesResponse.json();
    const franchiseCA = sales.reduce((total: number, sale: any) => total + Number(sale.chiffre_affaires), 0);
    
    console.log('📊 Ventes récupérées:', sales.length, 'CA total:', franchiseCA);

    // Récupérer les achats du franchisé dans les entrepôts Driv'n Cook
    // Au lieu de chercher dans les commandes, on va chercher dans le stock actuel
    const franchiseStockResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/franchise-stock/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!franchiseStockResponse.ok) {
      return NextResponse.json({ error: 'Erreur lors de la récupération du stock' }, { status: franchiseStockResponse.status });
    }

    const franchiseStock = await franchiseStockResponse.json();
    
    console.log('🔍 Stock du franchisé récupéré:', franchiseStock);
    
    // Calculer la valeur totale du stock actuel
    const franchiseAchats = franchiseStock.reduce((total: number, stock: any) => {
      const valeurStock = Number(stock.quantite) * Number(stock.product?.prix || 0);
      console.log('💰 Stock:', stock.product?.nom, 'Quantité:', stock.quantite, 'Prix unitaire:', stock.product?.prix, 'Valeur:', valeurStock);
      return total + valeurStock;
    }, 0);
    
    console.log('🛒 Stock récupéré:', franchiseStock.length, 'Valeur totale du stock:', franchiseAchats);
    console.log('📅 Calcul basé sur le stock actuel (pas de filtrage de date)');
    
    const pourcentageAchats = franchiseCA > 0 ? (franchiseAchats / franchiseCA) * 100 : 0;
    const estConforme = pourcentageAchats >= 80;
    const montantRequis = franchiseCA > 0 ? Math.max(0, (franchiseCA * 0.8) - franchiseAchats) : 0;
    
    console.log('✅ Calcul final:', { franchiseCA, franchiseAchats, pourcentageAchats, estConforme, montantRequis });

    return NextResponse.json({
      success: true,
      compliance: {
        estConforme,
        pourcentageAchats: pourcentageAchats.toFixed(1),
        chiffreAffairesTotal: franchiseCA,
        achatsDrivnCook: franchiseAchats,
        achatsObligatoires: franchiseCA * 0.8,
        montantRequis,
        periode: `${currentMonth}/${currentYear}`
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du statut de conformité:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
