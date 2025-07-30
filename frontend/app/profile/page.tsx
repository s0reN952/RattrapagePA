"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "" });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("http://localhost:3001/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setForm({ nom: data.nom, prenom: data.prenom, email: data.email, password: "" });
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger le profil");
        setLoading(false);
      });
  }, [router]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError("Erreur lors de la mise à jour");
        return;
      }
      setSuccess("Profil mis à jour !");
    } catch {
      setError("Erreur serveur");
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 32 }}>
      <h1>Mon profil</h1>
      <form onSubmit={handleSubmit}>
        <label>Nom</label>
        <input name="nom" value={form.nom} onChange={handleChange} required />
        <label>Prénom</label>
        <input name="prenom" value={form.prenom} onChange={handleChange} required />
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
        <label>Nouveau mot de passe</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Laisser vide pour ne pas changer" />
        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: "green", marginBottom: 16 }}>{success}</div>}
        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  );
} 