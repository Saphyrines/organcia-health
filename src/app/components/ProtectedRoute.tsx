"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login"); // Redirection si non connecté
      } else {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 50 }}>Chargement...</p>;
  }

  return <>{children}</>;
}
