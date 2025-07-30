"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Warehouse {
  id: number;
  nom: string;
  adresse: string;
  description: string;
  statut: string;
}

interface Product {
  id: number;
  nom: string;
  prix: number;
  categorie: string;
  description: string;
  statut: string;
  warehouse: Warehouse;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const [warehousesRes, productsRes] = await Promise.all([
        fetch("http://localhost:3001/warehouses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3001/products", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (!warehousesRes.ok || !productsRes.ok) throw new Error("Erreur de chargement");

      const warehousesData = await warehousesRes.json();
      const productsData = await productsRes.json();

      setWarehouses(warehousesData);
      setProducts(productsData);
    } catch (err) {
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>🏢 Entrepôts Driv'n Cook</h1>
      
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      <div style={{ marginBottom: "2rem" }}>
        <h2>📋 Conditions financières</h2>
        <div className="card">
          <ul style={{ lineHeight: "1.8" }}>
            <li><strong>Droit d'entrée :</strong> 50 000 €</li>
            <li><strong>Commission :</strong> 4% du chiffre d'affaires</li>
            <li><strong>Achat obligatoire :</strong> 80% du CA dans les entrepôts</li>
            <li><strong>Achat libre :</strong> 20% du CA</li>
          </ul>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="card">
            <h3>🏪 {warehouse.nom}</h3>
            <p><strong>Adresse :</strong> {warehouse.adresse}</p>
            <p><strong>Statut :</strong> {warehouse.statut}</p>
            <p><strong>Description :</strong> {warehouse.description}</p>
            
            <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>📦 Produits disponibles</h4>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {products
                .filter(product => product.warehouse?.id === warehouse.id)
                .map(product => (
                  <div key={product.id} style={{ 
                    padding: "0.5rem", 
                    backgroundColor: "#f8f9fa", 
                    borderRadius: "4px",
                    border: "1px solid #e9ecef"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span><strong>{product.nom}</strong></span>
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>{product.prix} EUR</span>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#666" }}>
                      {product.categorie} - {product.statut}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
} 