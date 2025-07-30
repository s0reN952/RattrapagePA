"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
}

interface Sales {
  id: number;
  periode: string;
  chiffre_affaires: number;
  nombre_commandes: number;
  marge_brute: number;
}

interface Order {
  id: number;
  numero: string;
  description: string;
  montant: number;
  statut: string;
}

interface Truck {
  id: number;
  nom: string;
  statut: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sales, setSales] = useState<Sales[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    const token = localStorage.getItem("token");
    try {
      // Charger les données utilisateur d'abord
      const userRes = await fetch("http://localhost:3001/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) {
        router.push("/login");
        return;
      }

      const userData = await userRes.json();
      setUser(userData);

      // Charger les autres données avec gestion d'erreur individuelle
      try {
        const salesRes = await fetch("http://localhost:3001/sales", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setSales(salesData);
        } else {
          console.log("Impossible de charger les ventes (droit d'entrée non payé ?)");
          setSales([]);
        }
      } catch (err) {
        console.log("Erreur lors du chargement des ventes:", err);
        setSales([]);
      }

      try {
        const ordersRes = await fetch("http://localhost:3001/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        } else {
          console.log("Impossible de charger les commandes (droit d'entrée non payé ?)");
          setOrders([]);
        }
      } catch (err) {
        console.log("Erreur lors du chargement des commandes:", err);
        setOrders([]);
      }

      try {
        const trucksRes = await fetch("http://localhost:3001/trucks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (trucksRes.ok) {
          const trucksData = await trucksRes.json();
          setTrucks(trucksData);
        } else {
          console.log("Impossible de charger les camions (droit d'entrée non payé ?)");
          setTrucks([]);
        }
      } catch (err) {
        console.log("Erreur lors du chargement des camions:", err);
        setTrucks([]);
      }

    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;
  }

  const totalCA = sales.reduce((sum, s) => sum + Number(s.chiffre_affaires), 0);
  const enService = trucks.filter(t => t.statut === 'en_service').length;

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Dashboard - {user?.prenom} {user?.nom}</h1>
      
      {/* Message pour les utilisateurs qui n'ont pas payé le droit d'entrée */}
      {sales.length === 0 && orders.length === 0 && trucks.length === 0 && (
        <div style={{ 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffeaa7", 
          borderRadius: "8px", 
          padding: "1rem", 
          marginBottom: "2rem",
          color: "#856404"
        }}>
          <h3>🚛 Bienvenue chez Driv'n Cook !</h3>
          <p>
            Pour commencer à utiliser toutes les fonctionnalités, vous devez d'abord payer le droit d'entrée de 50 000€.
          </p>
          <button 
            onClick={() => router.push("/droit-entree")}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "0.5rem"
            }}
          >
            Payer le droit d'entrée
          </button>
        </div>
      )}
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="card">
          <h3>💰 CA Total</h3>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#28a745" }}>
            {totalCA} EUR
          </div>
        </div>
        
        <div className="card">
          <h3>🚛 Camions en service</h3>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#17a2b8" }}>
            {enService}/{trucks.length}
          </div>
        </div>
        
        <div className="card">
          <h3>📦 Commandes</h3>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffc107" }}>
            {orders.length}
          </div>
        </div>
        
        <div className="card">
          <h3>📊 Périodes de vente</h3>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#dc3545" }}>
            {sales.length}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Accès rapides</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={() => router.push("/trucks")}>🚛 Camions</button>
          <button onClick={() => router.push("/orders")}>📋 Commandes</button>
          <button onClick={() => router.push("/sales")}>📊 Ventes</button>
          <button onClick={() => router.push("/profile")}>👤 Profil</button>
        </div>
      </div>
    </main>
  );
} 