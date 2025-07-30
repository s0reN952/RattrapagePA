"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Truck {
  id: number;
  nom: string;
  statut: 'en_service' | 'en_panne' | 'entretien';
}

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [formData, setFormData] = useState({ nom: "", statut: "en_service" as 'en_service' | 'en_panne' | 'entretien' });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadTrucks();
  }, [router]);

  const loadTrucks = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3001/trucks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setTrucks(data);
    } catch (err) {
      setError("Erreur lors du chargement des camions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const url = editingTruck 
        ? `http://localhost:3001/trucks/${editingTruck.id}`
        : "http://localhost:3001/trucks";
      
      const response = await fetch(url, {
        method: editingTruck ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'opération");
      }
      
      setShowForm(false);
      setEditingTruck(null);
      setFormData({ nom: "", statut: "en_service" as 'en_service' | 'en_panne' | 'entretien' });
      setError(""); // Effacer les erreurs précédentes
      setSuccess(editingTruck ? "Camion modifié avec succès !" : "Camion ajouté avec succès !");
      loadTrucks();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'opération");
      setSuccess(""); // Effacer les messages de succès en cas d'erreur
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce camion ?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3001/trucks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }
      
      setError(""); // Effacer les erreurs précédentes
      setSuccess("Camion supprimé avec succès !");
      loadTrucks();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setSuccess(""); // Effacer les messages de succès en cas d'erreur
    }
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({ nom: truck.nom, statut: truck.statut });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingTruck(null);
    setFormData({ nom: "", statut: "en_service" });
    setShowForm(true);
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;

  return (
    <main style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Mes camions</h1>
        <button onClick={handleAdd}>Ajouter un camion</button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: "1rem", backgroundColor: "#d4edda", padding: "0.75rem", borderRadius: "4px", border: "1px solid #c3e6cb" }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3>{editingTruck ? "Modifier le camion" : "Ajouter un camion"}</h3>
          <form onSubmit={handleSubmit}>
            <label>Nom du camion</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
            />
            
            <label>Statut</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
              style={{ padding: "0.75rem", border: "2px solid #e1e5e9", borderRadius: "4px", fontSize: "1rem" }}
            >
              <option value="en_service">En service</option>
              <option value="en_panne">En panne</option>
              <option value="entretien">En entretien</option>
            </select>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit">
                {editingTruck ? "Modifier" : "Ajouter"}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingTruck(null);
                  setFormData({ nom: "", statut: "en_service" });
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
        {trucks.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p>Aucun camion enregistré</p>
          </div>
        ) : (
          trucks.map((truck) => (
            <div key={truck.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4>{truck.nom}</h4>
                <p>Statut: {truck.statut}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  onClick={() => handleEdit(truck)}
                  style={{ backgroundColor: "#457B9D" }}
                >
                  Modifier
                </button>
                <button 
                  onClick={() => handleDelete(truck.id)}
                  style={{ backgroundColor: "#dc3545" }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
} 