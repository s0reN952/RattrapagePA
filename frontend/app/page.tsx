import Image from "next/image";

export default function Home() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Bienvenue chez Driv'n Cook</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        Gestion des franchisés et du parc de camions
      </p>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="card">
          <h3>Fonctionnalités disponibles</h3>
          <ul style={{ textAlign: "left", lineHeight: "1.8" }}>
            <li>✅ Inscription et connexion des franchisés</li>
            <li>✅ Gestion du profil personnel</li>
            <li>✅ Gestion du parc de camions</li>
            <li>✅ Gestion des commandes et entrepôts</li>
            <li>✅ Analyse des ventes avec génération de PDF</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
