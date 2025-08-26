"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Erreur de connexion");
        return;
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      // Décoder le JWT pour récupérer le rôle
      const token = data.access_token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role;
      
      // Déclencher un événement pour notifier la navbar
      window.dispatchEvent(new Event('storage'));
      
      // Redirection selon le rôle
      if (userRole === 'super_admin' || userRole === 'admin') {
        router.push("/admin"); // Interface admin
      } else {
        router.push("/dashboard"); // Interface franchisé
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
} 