"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from 'next/link'
import { COLORS } from '@/lib/color'

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      alert("Inscription réussie ! Vérifie ta boîte mail pour confirmer.");
      router.push("/login");
    }
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        maxWidth: 400,
        margin: "50px auto",
        padding: 30,
        borderRadius: 8,
        boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        fontFamily: COLORS.police,
        color: "black",
      }}
    >
      <h1 style={{ color: COLORS.main, textAlign: "center", marginBottom: 5, fontWeight: "bold", fontSize: "20px" }}>
        Bienvenue !
      </h1>
      <div style={{ marginTop: '5px', marginBottom: 24, textAlign: "center" }}>
        Vous avez déjà un compte ?{' '}
        <Link href="/login"
          style={{ color: COLORS.secondary, textDecoration: 'underline' }}>Connectez-vous !
        </Link>
      </div>
      <form onSubmit={handleSignup}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 4,
            border: "2px solid ${COLORS.main}",
            marginBottom: 20,
            fontSize: 16,
            outline: "none",
          }}
          placeholder="ton.email@example.com"
        />

        <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 4,
            border: "2px solid ${COLORS.main}",
            marginBottom: 30,
            fontSize: 16,
            outline: "none",
          }}
          placeholder="Au moins 8 caractères"
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: COLORS.main,
            color: "white",
            fontWeight: "600",
            fontSize: 16,
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget.style.backgroundColor = "#b45f3f");
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.currentTarget.style.backgroundColor = COLORS.main);
          }}
        >
          {loading ? "Chargement..." : "S'inscrire"}
        </button>
      </form>

      {errorMsg && (
        <p
          style={{
            color: "red",
            marginTop: 20,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}


