"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { COLORS } from '@/lib/color'

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        router.push("/compte");
      } else {
        router.push("/login");
      }
    };

    checkUser();
  }, [router]);

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        background: "white",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: COLORS.police,
      }}
    >
      <p style={{ color: COLORS.main }}>Redirection en cours...</p>
    </main>
  );
}
