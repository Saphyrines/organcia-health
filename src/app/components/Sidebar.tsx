"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { COLORS } from '@/lib/color'

import { MdFlag } from 'react-icons/md';
import { GiWeightLiftingUp, GiMeal } from 'react-icons/gi';
import { TbChartPie } from 'react-icons/tb';
import { FaShoppingBasket } from 'react-icons/fa';
import {
  FiHome,
  FiUser,
  FiLogOut,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiBriefcase,
} from "react-icons/fi";
import { FaReceipt } from "react-icons/fa";

import Topbar from "./Topbar";

export default function Sidebar() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };


  const eventLinks = [
    { label: "Mes objectifs", path: "objectifs", icon: <MdFlag /> },
    { label: "Mes séances", path: "seances", icon: <GiWeightLiftingUp /> },
    { label: "Mes macros", path: "macros", icon: <TbChartPie /> },
    { label: "Mes recettes", path: "recettes", icon: <GiMeal /> },
    { label: "Ma liste de courses", path: "courses", icon: <FaShoppingBasket /> }
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDrawerLinkClick = () => setDrawerOpen(false);

  const navStyle: React.CSSProperties = {
    display: isMobile ? "none" : "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100vh",
    width: isHovered ? 200 : 60,
    backgroundColor: COLORS.third,
    borderRight: "1px solid #ccc",
    position: "fixed",
    top: 0,
    left: 0,
    transition: "width 0.3s ease-in-out",
    padding: 10,
    boxSizing: "border-box",
    zIndex: 1000,
  };

  const drawerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: drawerOpen ? 0 : -250,
    width: 250,
    height: "100%",
    backgroundColor: COLORS.third,
    padding: 10,
    boxSizing: "border-box",
    zIndex: 1050,
    transition: "left 0.3s ease-in-out",
    borderRight: "1px solid #ccc",
    display: "flex",
    flexDirection: "column",
    paddingTop: "70px",
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: drawerOpen ? "100%" : 0,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1040,
    transition: "width 0.3s ease-in-out",
    overflow: "hidden",
  };

  const ulStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    marginBottom: 0,
    fontWeight: "bold",
  };

  const liStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    color: "white",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
  };

  const iconStyle: React.CSSProperties = {
    marginRight: 10,
    fontSize: 20,
    minWidth: 20,
    textAlign: "center",
  };

  const linkTextStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  };

  const subLinkStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#333",
    fontSize: 14,
    textDecoration: "none",
    transition: "background-color 0.2s",
    whiteSpace: "nowrap",
    overflow: "hidden",
    justifyContent: "flex-start",
  };

  const renderLinks = () => (
    <>
      <div style={{ flexGrow: 1 }}>
        <ul style={ulStyle}>
          {/* Accueil */}
          {isMobile ? (
            <li style={liStyle} onClick={handleDrawerLinkClick}>
              <Link href="/" style={{ ...linkTextStyle, color: "white" }}>
                <FiHome style={iconStyle} />
                Mes évènements
              </Link>
            </li>
          ) : (
            <li style={liStyle}>
              <Link href="/" style={{ ...linkTextStyle, color: "white" }} onClick={handleDrawerLinkClick}>
                <FiHome style={iconStyle} />
                {isHovered && "Accueil"}
              </Link>
            </li>
          )}

          {/* Liens d'évènement */}
          {
            eventLinks.map(({ label, path, icon }) => (
              <li
                key={path}
                style={isMobile ? subLinkStyle : {
                  ...subLinkStyle,
                  backgroundColor: "#fff",
                  ...(isHovered ? {} : { textAlign: "center" }),
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && e.currentTarget) e.currentTarget.style.backgroundColor = COLORS.third;
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && e.currentTarget) e.currentTarget.style.backgroundColor = "#fff";
                }}
                onClick={handleDrawerLinkClick}
              >
                <Link
                  href={path}
                  style={{ ...linkTextStyle, color: "#333" }}
                >
                  <span style={iconStyle}>{icon}</span>
                  {isMobile ? label : isHovered && label}
                </Link>
              </li>
            ))}
        </ul>
      </div>

      <div style={{ marginTop: "auto" }}>
        <ul style={ulStyle}>
          {/* Mon compte (uniquement en desktop) */}
          {!isMobile && (
            <li style={liStyle}>
              <Link href="/compte" style={{ ...linkTextStyle, color: "white" }} onClick={handleDrawerLinkClick}>
                <FiUser style={iconStyle} />
                {isHovered && "Mon compte"}
              </Link>
            </li>
          )}

          {/* Déconnexion */}
          <li style={{ ...liStyle, backgroundColor: "white", marginBottom: "0" }}>
            <button
              onClick={() => {
                handleLogout();
                handleDrawerLinkClick();
              }}
              style={{
                background: "none",
                border: "none",
                color: COLORS.main,
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
            >
              <FiLogOut style={{ ...iconStyle, color: COLORS.main }} />
              <span style={{ marginLeft: 8 }}>{isMobile ? "Se déconnecter" : isHovered && "Se déconnecter"}</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      {!isMobile && (
        <nav style={navStyle} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          {renderLinks()}
        </nav>
      )}

      {isMobile && (
        <>
          <Topbar onMenuClick={() => setDrawerOpen(prev => !prev)} />
          <div style={overlayStyle} onClick={() => setDrawerOpen(false)} />
          <div style={drawerStyle}>{renderLinks()}</div>
        </>
      )}
    </>
  );
}
