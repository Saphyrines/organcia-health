"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
/*import { stringify } from "querystring";*/
import { UserMetadata, User } from "@supabase/supabase-js";
import Sidebar from "@/app/components/Sidebar";
/*import { CiTextAlignCenter } from "react-icons/ci";*/
import toast from 'react-hot-toast';
import { COLORS } from '@/lib/color'

export default function ComptePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserMetadata>({
    nom: "",
    prenom: "",
    email: "",
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("Utilisateurs")
        .select("nom, prenom, email")
        .eq("id", user.id)
        .single();

      if (data && !error) {
        setUserData({
          nom: data.nom || "",
          prenom: data.prenom || "",
          email: user.email,
        });
      }

      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
    } else {
      setUserData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const updates = {
      nom: userData.nom,
      prenom: userData.prenom,
    };

    const { error } = await supabase
      .from("Utilisateurs")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour des infos.");
    } else {
      toast.success("Nom et prénom mis à jour !");
    }
  };

  const handleEmailChange = async () => {
    if (!user) return;

    const { error } = await supabase.auth.updateUser({
      email: userData.email,
    });

    if (error) {
      toast.error("Erreur lors de la mise à jour de l’email.");
    } else {
      toast.success("Un email de confirmation a été envoyé à la nouvelle adresse.");
      await supabase
        .from("Utilisateurs")
        .update({ email: userData.email })
        .eq("id", user.id);
    }
  };

  const handlePasswordChange = async () => {
    if (!password) return alert("Merci de remplir le champ mot de passe.");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast.error("Erreur lors du changement de mot de passe.");
    } else {
      toast.success("Mot de passe mis à jour !");
      setPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmDelete = confirm(
      "Êtes-vous sûr(e) de vouloir supprimer votre compte ? Cette action est irréversible."
    );

    if (!confirmDelete) return;

    // Supprimer d'abord l'utilisateur dans la table
    await supabase.from("Utilisateurs").delete().eq("id", user.id);

    // Puis supprimer de l'auth (Supabase fait ça côté serveur en pratique avec RLS)
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      toast.error("Erreur lors de la suppression du compte.");
    } else {
      toast.success("Compte supprimé.");
      router.push("/login");
    }
  };

  if (loading) return <p>Chargement...</p>;

/*const containerStyle = {
  margin: "40px auto",
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: "white",
  color: "black",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};*/

const titleStyle: React.CSSProperties = {
  marginBottom: "30px",
  color: "black",
  fontWeight: "bold",
  fontSize: "25px",
  textAlign: "center"
};

const labelStyle = {
  display: "block",
  marginTop: "10px",
  marginBottom: "4px",
  fontWeight: "bold",
  color: COLORS.secondary
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #d9d9d9",
  borderRadius: "4px",
};

const buttonStyle = {
  marginTop: "10px",
  padding: "2px 4px",
  backgroundColor: "white",
  color: COLORS.main,
  border: "1px solid #d47950",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "15px",
};

return (
  <div style={{ display: "flex" }}>
    <Sidebar />

    <main
      style={{
        flex: 1,
        padding: isMobile? "20px 20px" : "40px",
        paddingTop: isMobile? "70px" : 40,
        marginLeft: isMobile? 0 : "60px",
        backgroundColor: "#fff",
        minHeight: "100vh",
        overflowY: "auto",
        fontFamily: COLORS.police,
        color: "#000",
      }}
    >
      <h1 style={titleStyle}>Mon compte</h1>

      <label style={labelStyle}>Nom</label>
      <input
        type="text"
        name="nom"
        value={userData.nom}
        onChange={handleChange}
        style={inputStyle}
      />

      <label style={labelStyle}>Prénom</label>
      <input
        type="text"
        name="prenom"
        value={userData.prenom}
        onChange={handleChange}
        style={inputStyle}
      />

      <button onClick={handleSave} style={buttonStyle}>
        Enregistrer les modifications
      </button>

      <hr style={{ margin: "20px 0", border: "0.5px solid ${COLORS.third}" }} />

      <label style={labelStyle}>Email</label>
      <input
        type="text"
        name="email"
        value={userData.email}
        onChange={handleChange}
        style={inputStyle}
      />
      <button onClick={handleEmailChange} style={buttonStyle}>
        Modifier l&apos;email
      </button>

      <label style={labelStyle}>Changer de mot de passe</label>
      <input
        type="password"
        name="password"
        value={password}
        onChange={handleChange}
        style={inputStyle}
        placeholder="Nouveau mot de passe"
      />
      <button onClick={handlePasswordChange} style={buttonStyle}>
        Modifier le mot de passe
      </button>

      <hr style={{ margin: "20px 0", border: "0.5px solid ${COLORS.third}" }} />

      <button
        onClick={handleDeleteAccount}
        style={{ ...buttonStyle, backgroundColor: COLORS.main, padding: "10px 20px", color: "white" }}
      >
        Supprimer mon compte
      </button>
    </main>
  </div>
)
}
