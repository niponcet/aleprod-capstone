"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  initialCounts?: {
    eventos?: number;
    palmetas?: number;
    palmetasMantencion?: number;
    incidencias?: number;
    repuestos?: number;
  };
  userNombre?: string;
  userRol?: string;
}

export function Sidebar({
  initialCounts,
  userNombre = "Gerencia",
  userRol = "Administrador total",
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  const [counts, setCounts] = useState({
    eventos: initialCounts?.eventos ?? 0,
    palmetas: initialCounts?.palmetas ?? 0,
    palmetasMantencion: initialCounts?.palmetasMantencion ?? 0,
    incidencias: initialCounts?.incidencias ?? 0,
    repuestos: initialCounts?.repuestos ?? 0,
  });

  const [nombre, setNombre] = useState(userNombre);
  const [rol, setRol] = useState(userRol);

  const fetchLiveCounts = useCallback(async () => {
    try {
      const [
        { count: totalEv },
        { data: palmetasData },
        { count: incCount },
        { count: repCount },
        { data: authData },
      ] = await Promise.all([
        supabase.from("eventos").select("id", { count: "exact", head: true }),
        supabase.from("palmetas_led").select("id, estado"),
        supabase.from("incidencias").select("id", { count: "exact", head: true }).eq("resuelto", false),
        supabase.from("repuestos_inventario").select("id", { count: "exact", head: true }),
        supabase.auth.getUser(),
      ]);

      const totalP = palmetasData?.length || 0;
      const mantP = palmetasData?.filter((p) => p.estado === "mantencion").length || 0;

      setCounts({
        eventos: totalEv || 0,
        palmetas: totalP,
        palmetasMantencion: mantP,
        incidencias: incCount || 0,
        repuestos: repCount || 0,
      });

      if (authData?.user) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("nombre_completo, rol")
          .eq("id", authData.user.id)
          .single();

        if (perfil) {
          setNombre(perfil.nombre_completo || "Gerencia");
          setRol(perfil.rol === "admin" ? "Administrador total" : "Técnico");
        }
      }
    } catch (err) {
      console.error("Error al actualizar sidebar:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLiveCounts();

    const channel = supabase
      .channel("sidebar-realtime-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "palmetas_led" }, () => fetchLiveCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "incidencias" }, () => fetchLiveCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "eventos" }, () => fetchLiveCounts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveCounts, supabase]);

  const navItems = [
    {
      label: "Inicio",
      href: "/",
      icon: (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: "none" }}
        >
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path>
        </svg>
      ),
      count: undefined,
      badgeColor: undefined,
    },
    {
      label: "Eventos",
      href: "/eventos",
      icon: (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: "none" }}
        >
          <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
          <path d="M8 2.5v4M16 2.5v4M3 10h18"></path>
        </svg>
      ),
      count: counts.eventos,
      badgeColor: "var(--sf2)",
      badgeTextColor: "var(--tx)",
    },
    {
      label: "Palmetas LED",
      href: "/palmetas",
      icon: (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: "none" }}
        >
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"></rect>
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"></rect>
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"></rect>
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"></rect>
        </svg>
      ),
      count: counts.palmetas,
      badgeColor: counts.palmetasMantencion > 0 ? "var(--was)" : "var(--oks)",
      badgeTextColor: counts.palmetasMantencion > 0 ? "var(--wa)" : "var(--ok)",
    },
    {
      label: "Incidencias",
      href: "/incidencias",
      icon: (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: "none" }}
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>
          <path d="M12 9v4M12 17h.01"></path>
        </svg>
      ),
      count: counts.incidencias,
      badgeColor: counts.incidencias > 0 ? "var(--ers)" : "var(--sf2)",
      badgeTextColor: counts.incidencias > 0 ? "var(--er)" : "var(--mu)",
    },
    {
      label: "Repuestos",
      href: "#repuestos",
      icon: (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: "none" }}
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      ),
      count: counts.repuestos,
      badgeColor: "var(--sf2)",
      badgeTextColor: "var(--mu)",
    },
  ];

  return (
    <aside
      style={{
        width: "264px",
        minWidth: "264px",
        maxWidth: "264px",
        boxSizing: "border-box",
        background: "var(--sf)",
        borderRight: "1px solid var(--bd)",
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        overflowY: "auto",
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "4px 8px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--go)",
            color: "var(--gt)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "15px",
            letterSpacing: ".02em",
            boxShadow: "0 2px 8px rgba(212,175,55,.25)",
            flexShrink: 0,
          }}
        >
          AP
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Alejandra Producciones
          </span>
          <span style={{ fontSize: "12px", color: "var(--mu)" }}>Panel de gerencia</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav aria-label="Navegación principal" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {/* OPERACIÓN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: ".1em",
              color: "var(--mu)",
              padding: "0 12px 6px",
            }}
          >
            OPERACIÓN
          </span>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="dash-nav"
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 12px",
                  borderRadius: "12px",
                  background: isActive ? "var(--prs)" : "transparent",
                  color: isActive ? "var(--lk)" : "var(--mu)",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  border: isActive ? "1px solid rgba(212, 175, 55, 0.25)" : "1px solid transparent",
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: item.badgeColor,
                      color: item.badgeTextColor,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ADMINISTRACIÓN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: ".1em",
              color: "var(--mu)",
              padding: "0 12px 6px",
            }}
          >
            ADMINISTRACIÓN
          </span>

          <div
            className="dash-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "11px 12px",
              borderRadius: "12px",
              color: "var(--mu)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flex: "none" }}
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"></path>
            </svg>
            <span style={{ flex: 1 }}>Técnicos y accesos</span>
          </div>

          <div
            className="dash-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "11px 12px",
              borderRadius: "12px",
              color: "var(--mu)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flex: "none" }}
            >
              <path d="M3 3v18h18"></path>
              <path d="M8 17v-6M13 17V7M18 17v-5"></path>
            </svg>
            <span style={{ flex: 1 }}>Reportes</span>
          </div>

          <div
            className="dash-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "11px 12px",
              borderRadius: "12px",
              color: "var(--mu)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flex: "none" }}
            >
              <path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h12M20 18h0"></path>
              <circle cx="14" cy="6" r="2"></circle>
              <circle cx="8" cy="12" r="2"></circle>
              <circle cx="18" cy="18" r="2"></circle>
            </svg>
            <span style={{ flex: 1 }}>Configuración</span>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Sincronización Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "12px",
            background: "var(--oks)",
            color: "var(--ok)",
            fontSize: "12.5px",
            fontWeight: 600,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: "none" }}
          >
            <path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 0 1 0 9z"></path>
            <path d="m9 13 2 2 4-4"></path>
          </svg>
          <span>Sincronización activa</span>
        </div>

        {/* User profile card & logout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 8px",
            borderTop: "1px solid var(--bd)",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              background: "var(--go)",
              color: "var(--gt)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nombre}
            </span>
            <span style={{ fontSize: "12px", color: "var(--mu)" }}>{rol}</span>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid var(--bd)",
                background: "transparent",
                color: "var(--mu)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
