"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Payment {
  id: number;
  type: 'droit_entree' | 'commission' | 'achat_obligatoire';
  montant: number;
  description: string;
  statut: 'en_attente' | 'paye' | 'annule';
  date_creation: string;
  date_paiement?: string;
}

interface FinancialSummary {
  droitEntree: number;
  totalCommissions: number;
  totalAchatsObligatoires: number;
  paiementsPayes: number;
  paiementsEnAttente: number;
  totalObligations: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        fetch("http://localhost:3001/payments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3001/payments/summary", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (!paymentsRes.ok || !summaryRes.ok) throw new Error("Erreur de chargement");

      const paymentsData = await paymentsRes.json();
      const summaryData = await summaryRes.json();

      // Filtrer pour exclure le droit d'entrée
      const filteredPayments = paymentsData.filter((payment: Payment) => payment.type !== 'droit_entree');
      
      setPayments(filteredPayments);
      setSummary(summaryData);
    } catch (err) {
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateCommissions = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3001/payments/calculate-commissions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur");
      
      loadData(); // Recharger les données
    } catch (err) {
      setError("Erreur lors du calcul des commissions");
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'commission': return 'Commission 4%';
      case 'achat_obligatoire': return 'Achat obligatoire 80%';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye': return '#28a745';
      case 'en_attente': return '#ffc107';
      case 'annule': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>💰 Gestion des Paiements</h1>
      
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      {/* Note sur le droit d'entrée */}
      <div style={{ 
        backgroundColor: "#e3f2fd", 
        padding: "1rem", 
        borderRadius: "8px", 
        marginBottom: "2rem",
        border: "1px solid #2196f3"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "#1976d2" }}>ℹ️ Information</h3>
        <p style={{ margin: "0", color: "#1976d2" }}>
          Le droit d'entrée de 50 000€ est géré séparément. 
          <a href="/droit-entree" style={{ color: "#1976d2", textDecoration: "underline", marginLeft: "0.5rem" }}>
            Cliquez ici pour le gérer
          </a>
        </p>
      </div>

      {/* Boutons d'action */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>⚡ Actions</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button 
            onClick={handleCalculateCommissions}
            style={{ 
              backgroundColor: "#17a2b8", 
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📊 Calculer commissions (4% CA)
          </button>
        </div>
      </div>

      {/* Résumé financier */}
      {summary && (
        <div style={{ marginBottom: "2rem" }}>
          <h2>📊 Résumé financier</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="card">
              <h3>Total commissions</h3>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#17a2b8" }}>
                {summary.totalCommissions} EUR
              </div>
            </div>
            
            <div className="card">
              <h3>Achats obligatoires</h3>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffc107" }}>
                {summary.totalAchatsObligatoires} EUR
              </div>
            </div>
            
            <div className="card">
              <h3>Paiements effectués</h3>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#28a745" }}>
                {summary.paiementsPayes} EUR
              </div>
            </div>
            
            <div className="card">
              <h3>En attente</h3>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffc107" }}>
                {summary.paiementsEnAttente} EUR
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des paiements */}
      <div className="card">
        <h2>📋 Historique des paiements</h2>
        {payments.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>Aucun paiement enregistré</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {payments.map((payment) => (
              <div key={payment.id} style={{ 
                padding: "1rem", 
                border: "1px solid #e9ecef", 
                borderRadius: "8px",
                backgroundColor: "#f8f9fa"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0" }}>{getTypeLabel(payment.type)}</h4>
                    <p style={{ margin: "0", color: "#666" }}>{payment.description}</p>
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "#666" }}>
                      Créé le {new Date(payment.date_creation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#28a745" }}>
                      {payment.montant} EUR
                    </div>
                    <span style={{ 
                      backgroundColor: getStatusColor(payment.statut),
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.875rem",
                      fontWeight: "bold"
                    }}>
                      {payment.statut === 'paye' ? 'Payé' : payment.statut === 'en_attente' ? 'En attente' : 'Annulé'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}