"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  numero: string;
  description: string;
  montant: number;
  statut: 'en_attente' | 'en_preparation' | 'en_livraison' | 'livree' | 'annulee';
  date_creation: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    numero: "",
    description: "",
    montant: "",
    statut: "en_attente" as 'en_attente' | 'en_preparation' | 'en_livraison' | 'livree' | 'annulee'
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3001/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const url = editingOrder 
        ? `http://localhost:3001/orders/${editingOrder.id}`
        : "http://localhost:3001/orders";
      
      const response = await fetch(url, {
        method: editingOrder ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          montant: parseFloat(formData.montant)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'opération");
      }
      
      setShowForm(false);
      setEditingOrder(null);
      setFormData({ numero: "", description: "", montant: "", statut: "en_attente" as 'en_attente' | 'en_preparation' | 'en_livraison' | 'livree' | 'annulee' });
      setError(""); // Effacer les erreurs précédentes
      setSuccess(editingOrder ? "Commande modifiée avec succès !" : "Commande créée avec succès !");
      loadOrders();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'opération");
      setSuccess(""); // Effacer les messages de succès en cas d'erreur
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3001/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }
      
      setError(""); // Effacer les erreurs précédentes
      setSuccess("Commande supprimée avec succès !");
      loadOrders();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setSuccess(""); // Effacer les messages de succès en cas d'erreur
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      numero: order.numero,
      description: order.description,
      montant: order.montant.toString(),
      statut: order.statut
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({ numero: "", description: "", montant: "", statut: "en_attente" });
    setShowForm(true);
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;

  return (
    <main style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Mes commandes d'approvisionnement</h1>
        <button onClick={handleAdd}>Nouvelle commande</button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: "1rem", backgroundColor: "#d4edda", padding: "0.75rem", borderRadius: "4px", border: "1px solid #c3e6cb" }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3>{editingOrder ? "Modifier la commande" : "Nouvelle commande"}</h3>
          <form onSubmit={handleSubmit}>
            <label>Numéro de commande</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              required
            />
            
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            
            <label>Montant (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              required
            />
            
            <label>Statut</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
            >
              <option value="en_attente">En attente</option>
              <option value="en_preparation">En préparation</option>
              <option value="en_livraison">En livraison</option>
              <option value="livree">Livrée</option>
              <option value="annulee">Annulée</option>
            </select>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit">
                {editingOrder ? "Modifier" : "Créer"}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingOrder(null);
                  setFormData({ numero: "", description: "", montant: "", statut: "en_attente" });
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
        {orders.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p>Aucune commande enregistrée</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4>Commande #{order.numero}</h4>
                  <p>{order.description}</p>
                  <p>Montant: {order.montant} €</p>
                  <p>Statut: {order.statut}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => handleEdit(order)}>Modifier</button>
                  <button onClick={() => handleDelete(order.id)} style={{ backgroundColor: "#dc3545" }}>
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