"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Sales {
  id: number;
  periode: string;
  chiffre_affaires: number;
  couts_operationnels: number;
  marge_brute: number;
  taux_marge: number;
  nombre_commandes: number;
  panier_moyen: number;
  commentaires: string;
  date_creation: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sales | null>(null);
  const [formData, setFormData] = useState({
    periode: "",
    chiffre_affaires: "",
    couts_operationnels: "",
    nombre_commandes: "",
    commentaires: ""
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadSales();
  }, [router]);

  const loadSales = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3001/sales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setSales(data);
    } catch (err) {
      setError("Erreur lors du chargement des ventes");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (sales.length === 0) return { totalCA: 0, totalMarge: 0, moyenneCommandes: 0, moyennePanier: 0 };
    
    const totalCA = sales.reduce((sum, sale) => sum + Number(sale.chiffre_affaires), 0);
    const totalMarge = sales.reduce((sum, sale) => sum + Number(sale.marge_brute), 0);
    const totalCommandes = sales.reduce((sum, sale) => sum + sale.nombre_commandes, 0);
    const moyenneCommandes = totalCommandes / sales.length;
    const moyennePanier = totalCA / totalCommandes;

    return { totalCA, totalMarge, moyenneCommandes, moyennePanier };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    // Calculs automatiques
    const chiffre_affaires = parseFloat(formData.chiffre_affaires);
    const couts_operationnels = parseFloat(formData.couts_operationnels);
    const nombre_commandes = parseInt(formData.nombre_commandes);
    const marge_brute = chiffre_affaires - couts_operationnels;
    const taux_marge = chiffre_affaires > 0 ? (marge_brute / chiffre_affaires) * 100 : 0;
    const panier_moyen = nombre_commandes > 0 ? chiffre_affaires / nombre_commandes : 0;

    try {
      const url = editingSale 
        ? `http://localhost:3001/sales/${editingSale.id}`
        : "http://localhost:3001/sales";
      
      const response = await fetch(url, {
        method: editingSale ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          periode: formData.periode,
          chiffre_affaires,
          couts_operationnels,
          nombre_commandes,
          commentaires: formData.commentaires
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('droit d\'entrée')) {
          setError("Le droit d'entrée de 50 000€ doit être payé avant de créer des ventes. Allez sur la page 'Droit d'entrée' pour effectuer le paiement.");
        } else {
          throw new Error("Erreur lors de l'opération");
        }
        return;
      }
      
      setShowForm(false);
      setEditingSale(null);
      setFormData({ periode: "", chiffre_affaires: "", couts_operationnels: "", nombre_commandes: "", commentaires: "" });
      loadSales();
    } catch (err) {
      setError("Erreur lors de l'opération");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette période de vente ?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3001/sales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('droit d\'entrée')) {
          setError("Le droit d'entrée de 50 000€ doit être payé avant de modifier des ventes. Allez sur la page 'Droit d'entrée' pour effectuer le paiement.");
        } else {
          throw new Error("Erreur lors de la suppression");
        }
        return;
      }
      
      loadSales();
    } catch (err) {
      setError("Erreur lors de la suppression");
    }
  };

  const handleEdit = (sale: Sales) => {
    setEditingSale(sale);
    setFormData({
      periode: sale.periode,
      chiffre_affaires: sale.chiffre_affaires.toString(),
      couts_operationnels: sale.couts_operationnels.toString(),
      nombre_commandes: sale.nombre_commandes.toString(),
      commentaires: sale.commentaires || ""
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingSale(null);
    setFormData({ periode: "", chiffre_affaires: "", couts_operationnels: "", nombre_commandes: "", commentaires: "" });
    setShowForm(true);
  };

  const generateReport = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3001/sales/generate-report", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Erreur lors de la génération");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Télécharger le fichier PDF
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-ventes-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Erreur lors de la génération du rapport");
    }
  };

  const stats = calculateStats();

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;

  return (
    <main style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>📊 Gestion des Ventes</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={generateReport} style={{ backgroundColor: "#28a745" }}>
            📄 Générer Rapport
          </button>
          <button onClick={handleAdd}>Ajouter une période de vente</button>
        </div>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      {/* Statistiques globales */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "1.5rem", 
        marginBottom: "2rem" 
      }}>
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <h3 style={{ color: "#28a745", fontSize: "1.5rem", margin: "0 0 0.5rem 0" }}>
            {stats.totalCA.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </h3>
          <p style={{ margin: 0, color: "#6c757d" }}>CA Total</p>
        </div>
        
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <h3 style={{ color: "#17a2b8", fontSize: "1.5rem", margin: "0 0 0.5rem 0" }}>
            {stats.totalMarge.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </h3>
          <p style={{ margin: 0, color: "#6c757d" }}>Marge Totale</p>
        </div>
        
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <h3 style={{ color: "#ffc107", fontSize: "1.5rem", margin: "0 0 0.5rem 0" }}>
            {stats.moyenneCommandes.toFixed(0)}
          </h3>
          <p style={{ margin: 0, color: "#6c757d" }}>Moyenne Commandes</p>
        </div>
        
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <h3 style={{ color: "#dc3545", fontSize: "1.5rem", margin: "0 0 0.5rem 0" }}>
            {stats.moyennePanier.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </h3>
          <p style={{ margin: 0, color: "#6c757d" }}>Panier Moyen</p>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3>{editingSale ? "Modifier la période de vente" : "Ajouter une période de vente"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label>Période (ex: Janvier 2024)</label>
                <input
                  type="text"
                  value={formData.periode}
                  onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label>Chiffre d'affaires (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.chiffre_affaires}
                  onChange={(e) => setFormData({ ...formData, chiffre_affaires: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label>Coûts opérationnels (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.couts_operationnels}
                  onChange={(e) => setFormData({ ...formData, couts_operationnels: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label>Nombre de commandes</label>
                <input
                  type="number"
                  value={formData.nombre_commandes}
                  onChange={(e) => setFormData({ ...formData, nombre_commandes: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <label>Commentaires (optionnel)</label>
              <textarea
                value={formData.commentaires}
                onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                rows={3}
                style={{ width: "100%", padding: "0.75rem", border: "2px solid #e1e5e9", borderRadius: "4px", fontSize: "1rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit">
                {editingSale ? "Modifier" : "Ajouter"}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingSale(null);
                  setFormData({ periode: "", chiffre_affaires: "", couts_operationnels: "", nombre_commandes: "", commentaires: "" });
                }}
                style={{ backgroundColor: "#6c757d" }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {sales.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p>Aucune période de vente enregistrée</p>
          </div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0" }}>{sale.periode}</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", fontSize: "0.9rem" }}>
                    <div>
                      <strong>CA:</strong> {Number(sale.chiffre_affaires).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div>
                      <strong>Coûts:</strong> {Number(sale.couts_operationnels).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div>
                      <strong>Marge:</strong> {Number(sale.marge_brute).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div>
                      <strong>Taux marge:</strong> {Number(sale.taux_marge).toFixed(1)}%
                    </div>
                    <div>
                      <strong>Commandes:</strong> {sale.nombre_commandes}
                    </div>
                    <div>
                      <strong>Panier moyen:</strong> {Number(sale.panier_moyen).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>
                  {sale.commentaires && (
                    <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                      <strong>Commentaires:</strong> {sale.commentaires}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={() => handleEdit(sale)}
                    style={{ backgroundColor: "#457B9D" }}
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDelete(sale.id)}
                    style={{ backgroundColor: "#dc3545" }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
} 