"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'franchise' | 'admin' | 'super_admin';
  isActive: boolean;
}

export default function NavBar() {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Décoder le token JWT pour obtenir les informations utilisateur
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userInfo: User = {
            id: payload.sub,
            email: payload.email,
            nom: payload.nom || '',
            prenom: payload.prenom || '',
            role: payload.role || 'franchise',
            isActive: payload.isActive || false
          };
          setUser(userInfo);
          setIsLogged(true);
        } catch (error) {
          console.error('Erreur lors du décodage du token:', error);
          localStorage.removeItem("token");
          setIsLogged(false);
          setUser(null);
        }
      } else {
        setIsLogged(false);
        setUser(null);
      }
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
    setUser(null);
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new Event('logout'));
    router.push("/login");
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

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
            {isAdmin ? (
              // Navigation pour les administrateurs
              <>
                <Link href="/admin" style={{ textDecoration: "none", color: "#2c3e50" }}>Dashboard Admin</Link>
                <Link href="/admin/franchises" style={{ textDecoration: "none", color: "#2c3e50" }}>Franchisés</Link>
                <Link href="/admin/trucks" style={{ textDecoration: "none", color: "#2c3e50" }}>Camions</Link>
                <Link href="/admin/financial" style={{ textDecoration: "none", color: "#2c3e50" }}>Financier</Link>
                <Link href="/admin/warehouses" style={{ textDecoration: "none", color: "#2c3e50" }}>Entrepôts</Link>
                <Link href="/admin/reports" style={{ textDecoration: "none", color: "#2c3e50" }}>Rapports</Link>
                <Link href="/admin/settings" style={{ textDecoration: "none", color: "#2c3e50" }}>Paramètres</Link>
              </>
            ) : (
              // Navigation pour les franchisés
              <>
                <Link href="/" style={{ textDecoration: "none", color: "#2c3e50" }}>Accueil</Link>
                <Link href="/dashboard" style={{ textDecoration: "none", color: "#2c3e50" }}>Dashboard</Link>
                <Link href="/trucks" style={{ textDecoration: "none", color: "#2c3e50" }}>Mes camions</Link>
                <Link href="/sales" style={{ textDecoration: "none", color: "#2c3e50" }}>Ventes</Link>
                <Link href="/warehouses" style={{ textDecoration: "none", color: "#2c3e50" }}>Entrepôts</Link>
                <Link href="/franchise-stock" style={{ textDecoration: "none", color: "#2c3e50" }}>Mon Stock</Link>
                <Link href="/payments" style={{ textDecoration: "none", color: "#2c3e50" }}>Paiements</Link>
                <Link href="/droit-entree" style={{ textDecoration: "none", color: "#2c3e50" }}>Droit d'entrée</Link>
                <Link href="/profile" style={{ textDecoration: "none", color: "#2c3e50" }}>Mon profil</Link>
              </>
            )}
            
            {/* Affichage du rôle et du nom */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              padding: "0.5rem",
              backgroundColor: isAdmin ? "#8B5CF6" : "#10B981",
              color: "white",
              borderRadius: "4px",
              fontSize: "0.875rem"
            }}>
              <span>{isAdmin ? '👑' : '🚛'}</span>
              <span>{user?.prenom} {user?.nom}</span>
              <span>({user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Franchisé'})</span>
            </div>
            
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