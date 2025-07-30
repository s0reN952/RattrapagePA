"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [isLogged, setIsLogged] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLogged(!!token);
    };

    // Vérifier l'état initial
    checkAuth();

    // Vérifier toutes les secondes pour détecter les changements
    const interval = setInterval(checkAuth, 1000);

    // Écouter les changements de localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Écouter les événements personnalisés pour la déconnexion
    window.addEventListener('logout', checkAuth);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogged(false);
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new Event('logout'));
    router.push("/login");
  };

  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      padding: "1rem 2rem",
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #e9ecef"
    }}>
      <Link href="/" style={{ 
        textDecoration: "none", 
        color: "#2c3e50", 
        fontWeight: "bold",
        fontSize: "1.5rem"
      }}>
        Driv'n Cook
      </Link>
      
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {!isLogged ? (
          <>
            <Link href="/login" style={{ 
              textDecoration: "none", 
              color: "#457B9D",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #457B9D"
            }}>
              Connexion
            </Link>
            <Link href="/register" style={{ 
              textDecoration: "none", 
              color: "white",
              backgroundColor: "#457B9D",
              padding: "0.5rem 1rem",
              borderRadius: "4px"
            }}>
              Inscription
            </Link>
          </>
        ) : (
          <>
            <Link href="/" style={{ textDecoration: "none", color: "#2c3e50" }}>Accueil</Link>
            <Link href="/dashboard" style={{ textDecoration: "none", color: "#2c3e50" }}>Dashboard</Link>
            <Link href="/trucks" style={{ textDecoration: "none", color: "#2c3e50" }}>Mes camions</Link>
            <Link href="/orders" style={{ textDecoration: "none", color: "#2c3e50" }}>Commandes</Link>
            <Link href="/sales" style={{ textDecoration: "none", color: "#2c3e50" }}>Ventes</Link>
            <Link href="/warehouses" style={{ textDecoration: "none", color: "#2c3e50" }}>Entrepôts</Link>
            <Link href="/payments" style={{ textDecoration: "none", color: "#2c3e50" }}>Paiements</Link>
            <Link href="/droit-entree" style={{ textDecoration: "none", color: "#2c3e50" }}>Droit d'entrée</Link>
            <Link href="/profile" style={{ textDecoration: "none", color: "#2c3e50" }}>Mon profil</Link>
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
} 