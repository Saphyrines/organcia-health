"use client";

import React, { useState } from "react";
import { FiMenu, FiUser } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { COLORS } from '@/lib/color'

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();

  const topbarStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    backgroundColor: "#fff",
    borderBottom: "2px solid #6f6f6f",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1100,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 24,
    cursor: "pointer",
    color: COLORS.main,
  };

  return (
    <header style={topbarStyle}>
      <FiMenu onClick={() => onMenuClick()} style={iconStyle} />
      <FiUser onClick={() => router.push("/compte")} style={iconStyle} />
    </header>
  );
}
