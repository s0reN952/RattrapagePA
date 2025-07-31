"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
}

interface PaymentStatus {
  paid: boolean;
  amount?: number;
  date?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadUserData();
  }, [router]);

  const loadUserData = async () => {
    const token = localStorage.getItem("token");
    try {
      // Charger les données utilisateur
      const userRes = await fetch("http://localhost:3001/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Erreur lors du chargement des données utilisateur");
      }

      const userData = await userRes.json();
      setUser(userData);

      // Vérifier le statut du droit d'entrée
      try {
        const paymentRes = await fetch("http://localhost:3001/payments/droit-entree/status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          console.log("Statut du paiement reçu:", paymentData);
          setPaymentStatus({
            paid: paymentData.paid || false,
            amount: paymentData.payment?.montant,
            date: paymentData.payment?.date_creation
          });
        } else {
          console.log("Erreur lors de la vérification du paiement:", paymentRes.status);
          // Si l'endpoint n'existe pas ou erreur, on considère comme non payé
          setPaymentStatus({ paid: false });
        }
      } catch (err) {
        console.log("Erreur lors de la vérification du paiement:", err);
        setPaymentStatus({ paid: false });
      }

    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur de connexion au serveur. Vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div>
          <div style={{ fontSize: "2rem", marginBottom: "1rem", color: "red" }}>❌</div>
          <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
          <div style={{ marginBottom: "1rem" }}>
            <p>Vérifiez que :</p>
            <ul style={{ textAlign: "left", display: "inline-block" }}>
              <li>Le backend est démarré sur le port 3001</li>
              <li>Vous êtes connecté avec un token valide</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "0.5rem"
            }}
          >
            Réessayer
          </button>
          <button 
            onClick={() => router.push("/login")}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  const isPaid = paymentStatus?.paid || false;

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Dashboard - {user?.prenom} {user?.nom}</h1>
      
      {/* Message de bienvenue */}
      {!isPaid ? (
        <div style={{ 
          backgroundColor: "#d1ecf1", 
          border: "1px solid #bee5eb", 
          borderRadius: "8px", 
          padding: "1rem", 
          marginBottom: "2rem",
          color: "#0c5460"
        }}>
          <h3>🚛 Bienvenue chez Driv'n Cook !</h3>
          <p>
            Pour commencer à utiliser toutes les fonctionnalités, vous devez d'abord payer le droit d'entrée de 50 000€.
          </p>
          <button 
            onClick={() => router.push("/paiement-stripe")}
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
      ) : (
        <div style={{ 
          backgroundColor: "#d4edda", 
          border: "1px solid #c3e6cb", 
          borderRadius: "8px", 
          padding: "1rem", 
          marginBottom: "2rem",
          color: "#155724"
        }}>
          <h3>✅ Bienvenue chez Driv'n Cook !</h3>
          <p>
            Votre droit d'entrée a été payé. Vous avez maintenant accès à toutes les fonctionnalités.
          </p>
        </div>
      )}
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="card">
          <h3>👤 Profil</h3>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#28a745" }}>
            {user?.prenom} {user?.nom}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
            {user?.email}
          </div>
        </div>
        
        <div className="card">
          <h3>💰 Droit d'entrée</h3>
          <div style={{ 
            fontSize: "1.5rem", 
            fontWeight: "bold", 
            color: isPaid ? "#28a745" : "#dc3545" 
          }}>
            {isPaid ? "Payé" : "À payer"}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
            {isPaid ? "50 000€" : "50 000€"}
          </div>
        </div>
        
        <div className="card">
          <h3>📊 Statut</h3>
          <div style={{ 
            fontSize: "1.5rem", 
            fontWeight: "bold", 
            color: isPaid ? "#28a745" : "#ffc107" 
          }}>
            {isPaid ? "Actif" : "En attente"}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
            {isPaid ? "Franchisé actif" : "Paiement requis"}
          </div>
        </div>
        
        <div className="card">
          <h3>🚛 Camions</h3>
          <div style={{ 
            fontSize: "1.5rem", 
            fontWeight: "bold", 
            color: isPaid ? "#17a2b8" : "#6c757d" 
          }}>
            {isPaid ? "Disponible" : "Non attribué"}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
            {isPaid ? "Gestion possible" : "Après paiement"}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Accès rapides</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {!isPaid ? (
            <button onClick={() => router.push("/paiement-stripe")}>💳 Payer le droit d'entrée</button>
          ) : (
            <button onClick={() => router.push("/trucks")}>🚛 Mes camions</button>
          )}
          <button onClick={() => router.push("/warehouses")}>🏢 Entrepôts</button>
          {isPaid && <button onClick={() => router.push("/orders")}>📋 Commandes</button>}
          {isPaid && <button onClick={() => router.push("/sales")}>📊 Ventes</button>}
          <button onClick={() => router.push("/profile")}>👤 Profil</button>
          <button onClick={() => router.push("/login")}>🔓 Se déconnecter</button>
        </div>
      </div>
    </main>
  );
} 