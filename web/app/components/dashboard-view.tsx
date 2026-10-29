"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./theme-toggle";

export interface DashboardViewProps {
  user: {
    id: string;
    email?: string;
  };
  perfil?: {
    nombre_completo: string | null;
    rol: string | null;
  } | null;
  initialEventos: Array<{
    id: string;
    nombre: string;
    locacion: string | null;
    fecha_inicio: string | null;
    fecha_termino: string | null;
    estado: string;
    metros_cuadrados: string | null;
    tipo_pantalla: string | null;
  }>;
  initialPalmetas: Array<{
    id: string;
    codigo_visible: string;
    qr_uuid: string;
    estado: "operativo" | "mantencion" | "baja";
    ubicacion_actual: string | null;
  }>;
  initialIncidencias: Array<{
    id: string;
    palmeta_id: string | null;
    qr_uuid: string;
    tipo_falla: string;
    resuelto: boolean;
    created_at: string;
    fecha_ocurrencia: string;
    codigo_palmeta?: string;
  }>;
  initialRepuestos: Array<{
    id: string;
    stock_actual: number;
    stock_minimo: number;
  }>;
}

export function DashboardView({
  user,
  perfil,
  initialEventos,
  initialPalmetas,
  initialIncidencias,
  initialRepuestos,
}: DashboardViewProps) {
  const supabase = createClient();

  /* ─── State ─── */
  const [filter, setFilter] = useState<"all" | "en_curso" | "finalizado">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventos, setEventos] = useState(initialEventos);
  const [palmetas, setPalmetas] = useState(initialPalmetas);
  const [incidencias, setIncidencias] = useState(initialIncidencias);
  const [modalNuevoEvento, setModalNuevoEvento] = useState(false);
  const [guardandoEvento, setGuardandoEvento] = useState(false);

  // Formulario nuevo evento
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaLocacion, setNuevaLocacion] = useState("");
  const [nuevosM2, setNuevosM2] = useState("50");
  const [nuevoTipo, setNuevoTipo] = useState("Pista de Baile LED");
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split("T")[0]);

  /* ─── Realtime Subscriptions ─── */
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "palmetas_led" }, async () => {
        const { data } = await supabase.from("palmetas_led").select("id, codigo_visible, qr_uuid, estado, ubicacion_actual");
        if (data) setPalmetas(data);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "incidencias" }, async () => {
        const { data } = await supabase.from("incidencias").select("id, palmeta_id, qr_uuid, tipo_falla, resuelto, created_at, fecha_ocurrencia").order("fecha_ocurrencia", { ascending: false });
        if (data) setIncidencias(data);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "eventos" }, async () => {
        const { data } = await supabase.from("eventos").select("*").order("fecha_inicio", { ascending: false });
        if (data) setEventos(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  /* ─── Derived Metrics ─── */
  const totalPalmetas = palmetas.length;
  const operativas = palmetas.filter((p) => p.estado === "operativo").length;
  const enMantencion = palmetas.filter((p) => p.estado === "mantencion").length;
  const dadasDeBaja = palmetas.filter((p) => p.estado === "baja").length;

  const totalM2 = (totalPalmetas * 0.25).toFixed(1);
  const operativasM2 = (operativas * 0.25).toFixed(1);
  const mantencionM2 = (enMantencion * 0.25).toFixed(1);
  const pctDisponible = totalPalmetas > 0 ? Math.round((operativas / totalPalmetas) * 100) : 0;

  const totalEventos = eventos.length;
  const eventoActivo = eventos.find((e) => e.estado === "en_curso") || eventos[0];
  const incidenciasPendientes = incidencias.filter((i) => !i.resuelto).length;

  const repuestosTotal = initialRepuestos.length;
  const repuestosBajoStock = initialRepuestos.filter((r) => r.stock_actual <= r.stock_minimo).length;

  /* ─── Filter Events ─── */
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      const matchFilter =
        filter === "all"
          ? true
          : filter === "en_curso"
          ? ev.estado === "en_curso"
          : ev.estado === "finalizado";

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        ev.nombre.toLowerCase().includes(q) ||
        (ev.locacion || "").toLowerCase().includes(q) ||
        (ev.tipo_pantalla || "").toLowerCase().includes(q);

      return matchFilter && matchQuery;
    });
  }, [eventos, filter, searchQuery]);

  const countAll = eventos.length;
  const countEnCurso = eventos.filter((e) => e.estado === "en_curso").length;
  const countFinalizados = eventos.filter((e) => e.estado === "finalizado").length;

  /* ─── Date Formatter ─── */
  const formatEventDate = (iso: string | null) => {
    if (!iso) return "Por definir";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  /* ─── Format Time Ago ─── */
  const formatTimeAgo = (iso: string) => {
    try {
      const now = new Date();
      const past = new Date(iso);
      const diffMs = now.getTime() - past.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return "Hace momentos";
      if (diffHrs < 24) return `Hace ${diffHrs} h`;
      const diffDays = Math.floor(diffHrs / 24);
      return `Hace ${diffDays} d`;
    } catch {
      return "Reciente";
    }
  };

  /* ─── Create Event Handler ─── */
  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    setGuardandoEvento(true);
    try {
      const { data, error } = await supabase
        .from("eventos")
        .insert({
          nombre: nuevoNombre.trim(),
          locacion: nuevaLocacion.trim() || "Por definir",
          metros_cuadrados: nuevosM2 || "0",
          tipo_pantalla: nuevoTipo,
          fecha_inicio: nuevaFecha ? new Date(nuevaFecha).toISOString() : new Date().toISOString(),
          estado: "planificado",
        })
        .select()
        .single();

      if (!error && data) {
        setEventos([data, ...eventos]);
        setModalNuevoEvento(false);
        setNuevoNombre("");
        setNuevaLocacion("");
      } else if (error) {
        alert("Error al crear evento: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGuardandoEvento(false);
    }
  };

  const nombreUsuario = perfil?.nombre_completo || user.email?.split("@")[0] || "Gerencia";

  return (
    <>
        {/* Top bar */}
        <header
          className="px-4 py-3 sm:px-8 flex flex-wrap items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md sticky top-0 z-30 transition-colors"
        >
          {/* Search Input */}
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "520px" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--pr)"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ position: "absolute", left: "14px", top: "13px" }}
            >
              <circle cx="11" cy="11" r="7"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              id="q"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar evento, palmeta, técnico o repuesto…"
              className="text-[16px] md:text-sm"
              style={{
                width: "100%",
                boxSizing: "border-box",
                height: "44px",
                padding: "0 14px 0 42px",
                borderRadius: "12px",
                border: "1px solid var(--bd)",
                background: "var(--sf2)",
                color: "var(--tx)",
                font: "inherit",
                outline: "none",
              }}
            />
          </div>

          <div style={{ flex: "1 1 0" }}></div>

          {/* Theme Toggle Button */}
          <ThemeToggle className="!w-11 !h-11" />

          {/* Notifications Button */}
          <button
            aria-label="Notificaciones"
            style={{
              position: "relative",
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              border: "1px solid var(--bd)",
              background: "var(--sf2)",
              color: "var(--tx)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"></path>
            </svg>
            {incidenciasPendientes > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "11px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  background: "var(--wa)",
                  border: "2px solid var(--sf)",
                }}
              ></span>
            )}
          </button>

          {/* "+ Nuevo evento" Button */}
          <button
            onClick={() => setModalNuevoEvento(true)}
            className="dash-btn"
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "12px",
              border: 0,
              background: "var(--go)",
              color: "var(--gt)",
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(212,175,55,.25)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Nuevo evento
          </button>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1">
          {/* Greeting */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1 style={{ margin: 0, fontSize: "30px", fontWeight: 800, letterSpacing: "-.02em" }}>
              Buenas tardes, {nombreUsuario}
            </h1>
            <p style={{ margin: 0, fontSize: "14.5px", color: "var(--mu)" }}>
              Resumen operativo ·{" "}
              {new Date().toLocaleDateString("es-CL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Hero: Montaje Activo */}
          <section
            aria-label="Montaje activo"
            className="bg-[var(--sf)] border border-[var(--bd)] rounded-[20px] p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-stretch card-shadow transition-shadow"
          >
            {/* Left side info */}
            <div
              style={{
                flex: "1 1 320px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    background: "var(--blue-badge-bg)",
                    color: "var(--blue-text)",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "999px",
                      background: "currentColor",
                    }}
                  ></span>
                  {eventoActivo?.estado === "en_curso" ? "MONTAJE ACTIVO" : "PRODUCCIÓN DESTACADA"}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    border: "1px solid var(--bd)",
                    color: "var(--mu)",
                    fontSize: "12.5px",
                    fontWeight: 500,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {eventoActivo?.locacion || "Santiago, Chile"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 800, letterSpacing: "-.02em" }}>
                  {eventoActivo?.nombre || "Festival Estadio Nacional"}
                </h2>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--lk)" }}>
                  {eventoActivo?.tipo_pantalla || "Pista de Baile LED"}
                </span>
              </div>

              <div>
                <Link
                  href="/eventos"
                  className="dash-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "44px",
                    padding: "0 18px",
                    borderRadius: "12px",
                    background: "var(--go)",
                    color: "var(--gt)",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 10px rgba(212,175,55,.2)",
                  }}
                >
                  Ver detalle del montaje
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 6 6 6-6 6"></path>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right side operational metrics: EXACT 2x2 GRID */}
            <div className="w-full lg:flex-[1.4] grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Superficie asignada (Fila 1, Col 1) */}
              <div
                style={{
                  background: "var(--sf2)",
                  border: "1px solid var(--bd)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "var(--mu)", fontWeight: 500 }}>
                  Superficie asignada
                </span>
                <span style={{ fontSize: "26px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                  {eventoActivo?.metros_cuadrados ? `${eventoActivo.metros_cuadrados} m²` : "0 m²"}
                </span>
                <span style={{ fontSize: "12.5px", color: "var(--mu)" }}>
                  {eventoActivo?.metros_cuadrados && eventoActivo.metros_cuadrados !== "0"
                    ? "Asignado en contrato"
                    : "Pendiente de asignar"}
                </span>
              </div>

              {/* 2. Operativos disponibles (Fila 1, Col 2) */}
              <div
                style={{
                  background: "var(--ok-badge-bg)",
                  border: "1px solid var(--bd)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "var(--ok-text)", fontWeight: 600 }}>
                  Operativos disponibles
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--tx)",
                  }}
                >
                  {operativasM2} m²
                </span>
                <span style={{ fontSize: "12.5px", color: "var(--ok-text)" }}>
                  {operativas} palmetas · {pctDisponible}% disponible
                </span>
              </div>

              {/* 3. En mantención (Fila 2, Col 1) */}
              <div
                style={{
                  background: "var(--wa-badge-bg)",
                  border: "1px solid var(--bd)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "var(--wa-text)", fontWeight: 600 }}>
                  En mantención
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--tx)",
                  }}
                >
                  {mantencionM2} m²
                </span>
                <span style={{ fontSize: "12.5px", color: "var(--wa-text)" }}>
                  {enMantencion} palmeta{enMantencion !== 1 ? "s" : ""}
                </span>
              </div>

              {/* 4. Dados de baja (Fila 2, Col 2) */}
              <div
                style={{
                  background: "var(--er-badge-bg)",
                  border: "1px solid var(--bd)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "var(--er-text)", fontWeight: 600 }}>
                  Dados de baja
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--tx)",
                  }}
                >
                  {(dadasDeBaja * 0.25).toFixed(1)} m²
                </span>
                <span style={{ fontSize: "12.5px", color: "var(--er-text)" }}>
                  {dadasDeBaja} palmeta{dadasDeBaja !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </section>

          {/* KPIs Row */}
          <section
            aria-label="Indicadores"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Eventos registrados */}
            <Link
              href="/eventos"
              className="dash-row card-shadow transition-shadow"
              style={{
                background: "var(--sf)",
                border: "1px solid var(--bd)",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--mu)" }}>
                  Eventos registrados
                </span>
                <span
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "11px",
                    background: "var(--blue-badge-bg)",
                    color: "var(--blue-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
                    <path d="M8 2.5v4M16 2.5v4M3 10h18"></path>
                  </svg>
                </span>
              </div>
              <span style={{ fontSize: "34px", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {totalEventos}
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--mu)" }}>
                {countEnCurso} en curso · {eventoActivo?.nombre || "Sin evento activo"}
              </span>
            </Link>

            {/* Parque de palmetas */}
            <Link
              href="/palmetas"
              className="dash-row card-shadow transition-shadow"
              style={{
                background: "var(--sf)",
                border: "1px solid var(--bd)",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--mu)" }}>
                  Parque de palmetas
                </span>
                <span
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "11px",
                    background: "var(--ok-badge-bg)",
                    color: "var(--ok-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"></rect>
                    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"></rect>
                    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"></rect>
                    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"></rect>
                  </svg>
                </span>
              </div>
              <span style={{ fontSize: "34px", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {totalPalmetas}
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--mu)" }}>
                <span style={{ color: "var(--ok)", fontWeight: 600 }}>{operativas} operativas</span> ·{" "}
                <span style={{ color: "var(--wa)", fontWeight: 600 }}>{enMantencion} en mantención</span>
              </span>
            </Link>

            {/* Incidencias en terreno */}
            <Link
              href="/incidencias"
              className="dash-row card-shadow transition-shadow"
              style={{
                background: "var(--sf)",
                border: "1px solid var(--bd)",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--mu)" }}>
                  Incidencias en terreno
                </span>
                <span
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "11px",
                    background: incidenciasPendientes > 0 ? "var(--ers)" : "var(--sf2)",
                    color: incidenciasPendientes > 0 ? "var(--er)" : "var(--mu)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>
                    <path d="M12 9v4M12 17h.01"></path>
                  </svg>
                </span>
              </div>
              <span style={{ fontSize: "34px", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {incidenciasPendientes}
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  color: incidenciasPendientes === 0 ? "var(--ok)" : "var(--er)",
                  fontWeight: 600,
                }}
              >
                {incidenciasPendientes === 0
                  ? "Sin fallas reportadas"
                  : `${incidenciasPendientes} falla${incidenciasPendientes > 1 ? "s" : ""} activa${incidenciasPendientes > 1 ? "s" : ""}`}
              </span>
            </Link>

            {/* Stock de repuestos */}
            <div
              className="dash-row card-shadow transition-shadow"
              style={{
                background: "var(--sf)",
                border: "1px solid var(--bd)",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--mu)" }}>
                  Stock de repuestos
                </span>
                <span
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "11px",
                    background: repuestosBajoStock > 0 ? "var(--ers)" : "var(--was)",
                    color: repuestosBajoStock > 0 ? "var(--er)" : "var(--wa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8 12 3 3 8v8l9 5 9-5z"></path>
                    <path d="m3.3 7.5 8.7 5 8.7-5M12 22V12.5"></path>
                  </svg>
                </span>
              </div>
              <span style={{ fontSize: "34px", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {repuestosTotal}
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  color: repuestosBajoStock > 0 ? "var(--er)" : "var(--wa)",
                  fontWeight: 600,
                }}
              >
                {repuestosTotal === 0
                  ? "Sin repuestos cargados · registrar stock"
                  : repuestosBajoStock > 0
                  ? `${repuestosBajoStock} ítem con stock crítico`
                  : "Inventario regular"}
              </span>
            </div>
          </section>

          {/* Events + Side Column */}
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left: Eventos y producciones */}
            <section
              aria-label="Eventos"
              className="w-full lg:flex-1 min-w-0 bg-[var(--sf)] border border-[var(--bd)] rounded-[20px] overflow-hidden card-shadow transition-shadow"
            >
              <div
                style={{
                  padding: "20px 24px 16px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                    Eventos y producciones
                  </h2>
                  <span style={{ fontSize: "13px", color: "var(--mu)" }}>
                    Cronograma, locaciones y estado de cada turno
                  </span>
                </div>

                {/* Filter Tabs */}
                <div
                  role="group"
                  aria-label="Filtrar eventos"
                  style={{
                    display: "flex",
                    gap: "4px",
                    padding: "4px",
                    borderRadius: "12px",
                    background: "var(--sf2)",
                  }}
                >
                  {(
                    [
                      { id: "all", label: "Todos", count: countAll },
                      { id: "en_curso", label: "En curso", count: countEnCurso },
                      { id: "finalizado", label: "Finalizados", count: countFinalizados },
                    ] as const
                  ).map((t) => {
                    const active = filter === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setFilter(t.id)}
                        aria-pressed={active}
                        style={{
                          border: 0,
                          height: "34px",
                          padding: "0 12px",
                          borderRadius: "9px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: active ? "var(--sf)" : "transparent",
                          color: active ? "var(--tx)" : "var(--mu)",
                          boxShadow: active ? "0 1px 2px rgba(0,0,0,.25)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {t.label}{" "}
                        <span style={{ opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>
                          {t.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event rows */}
              <div style={{ borderTop: "1px solid var(--bd)" }}>
                {eventosFiltrados.length > 0 ? (
                  eventosFiltrados.map((ev) => {
                    const isLive = ev.estado === "en_curso";
                    const isDone = ev.estado === "finalizado";

                    return (
                      <Link
                        key={ev.id}
                        href="/eventos"
                        className="dash-row card-shadow transition-shadow"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: "12px 20px",
                          padding: "16px 24px",
                          borderBottom: "1px solid var(--bd)",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {/* Name & config */}
                        <div style={{ flex: "2 1 220px", minWidth: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "15px", fontWeight: 700 }}>{ev.nombre}</span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: "8px",
                                background: "var(--sf2)",
                                color: "var(--mu)",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {ev.metros_cuadrados ? `${ev.metros_cuadrados} m²` : "0 m²"}
                            </span>
                          </div>
                          <span style={{ fontSize: "13px", color: "var(--mu)" }}>
                            {ev.locacion || "Santiago"} · {ev.tipo_pantalla || "Pista de Baile LED"}
                          </span>
                        </div>

                        {/* Dates */}
                        <div style={{ flex: "1 1 110px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 600 }}>
                            {isLive ? "En curso" : formatEventDate(ev.fecha_inicio)}
                          </span>
                          <span style={{ fontSize: "12.5px", color: "var(--mu)" }}>
                            {isLive ? "Montaje activo" : ev.fecha_termino ? `Hasta ${formatEventDate(ev.fecha_termino)}` : "Finalizado"}
                          </span>
                        </div>

                        {/* Status Chip */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: ".04em",
                            whiteSpace: "nowrap",
                            background: isLive ? "var(--blue-badge-bg)" : isDone ? "var(--neutral-badge-bg)" : "var(--wa-badge-bg)",
                            color: isLive ? "var(--blue-text)" : isDone ? "var(--neutral-badge-text)" : "var(--wa-text)",
                          }}
                        >
                          {isLive ? "EN CURSO" : isDone ? "FINALIZADO" : "PLANIFICADO"}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div style={{ padding: "36px 24px", textAlign: "center", color: "var(--mu)", fontSize: "14px" }}>
                    No hay eventos con este estado.
                  </div>
                )}
              </div>

              {/* View all footer */}
              <div style={{ padding: "14px 24px", display: "flex", justifyContent: "flex-end" }}>
                <Link
                  href="/eventos"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "var(--lk)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                  }}
                >
                  Ver todos los eventos
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 6 6 6-6 6"></path>
                  </svg>
                </Link>
              </div>
            </section>

            {/* Right: Side Column */}
            <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 min-w-0 flex flex-col gap-6">
              {/* Requiere atención */}
              <section
                aria-label="Requiere atención"
                className="card-shadow transition-shadow"
                style={{
                  background: "var(--sf)",
                  border: "1px solid var(--bd)",
                  borderRadius: "20px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Requiere atención</h2>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: enMantencion > 0 ? "var(--wa-badge-bg)" : "var(--ok-badge-bg)",
                      color: enMantencion > 0 ? "var(--wa-text)" : "var(--ok-text)",
                    }}
                  >
                    {enMantencion > 0 ? `${enMantencion} palmeta${enMantencion > 1 ? "s" : ""}` : "Al día"}
                  </span>
                </div>

                {/* Unresolved / Mantención Palmetas */}
                {palmetas.filter((p) => p.estado === "mantencion").length > 0 ? (
                  palmetas
                    .filter((p) => p.estado === "mantencion")
                    .map((p) => {
                      const inc = incidencias.find((i) => i.palmeta_id === p.id || i.qr_uuid === p.qr_uuid);
                      return (
                        <Link
                          key={p.id}
                          href="/incidencias"
                          className="dash-row card-shadow transition-shadow"
                          style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-start",
                            padding: "12px",
                            borderRadius: "14px",
                            background: "var(--sf2)",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <span
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "10px",
                              background: "var(--was)",
                              color: "var(--wa)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flex: "none",
                            }}
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>
                              <path d="M12 9v4M12 17h.01"></path>
                            </svg>
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "14px", fontWeight: 700 }}>Palmeta #{p.codigo_visible}</span>
                            <span style={{ fontSize: "12.5px", color: "var(--mu)" }}>
                              En mantención · {inc?.tipo_falla || "Revisión técnica en taller"}
                            </span>
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--mu)", whiteSpace: "nowrap" }}>
                            {inc ? formatTimeAgo(inc.fecha_ocurrencia) : "Reciente"}
                          </span>
                        </Link>
                      );
                    })
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px",
                      borderRadius: "14px",
                      background: "var(--oks)",
                      color: "var(--ok)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      Todo el parque se encuentra operativo y sin averías pendientes.
                    </span>
                  </div>
                )}

                <Link
                  href="/palmetas"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "var(--lk)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                  }}
                >
                  Ir al inventario de palmetas
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 6 6 6-6 6"></path>
                  </svg>
                </Link>
              </section>

              {/* Estado del parque */}
              <section
                aria-label="Estado del parque"
                className="card-shadow transition-shadow"
                style={{
                  background: "var(--sf)",
                  border: "1px solid var(--bd)",
                  borderRadius: "20px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Estado del parque</h2>
                  <span style={{ fontSize: "12.5px", color: "var(--mu)", fontVariantNumeric: "tabular-nums" }}>
                    {totalM2} m² total
                  </span>
                </div>

                {/* Multi-segment progress bar */}
                <div
                  role="img"
                  aria-label={`Parque: ${operativas} operativas, ${enMantencion} en mantención`}
                  style={{
                    display: "flex",
                    height: "10px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    background: "var(--sf2)",
                  }}
                >
                  {totalPalmetas > 0 ? (
                    <>
                      <div
                        style={{
                          width: `${(operativas / totalPalmetas) * 100}%`,
                          background: "var(--ok)",
                          transition: "width 0.4s ease",
                        }}
                      ></div>
                      <div
                        style={{
                          width: `${(enMantencion / totalPalmetas) * 100}%`,
                          background: "var(--wa)",
                          transition: "width 0.4s ease",
                        }}
                      ></div>
                      <div
                        style={{
                          width: `${(dadasDeBaja / totalPalmetas) * 100}%`,
                          background: "var(--er)",
                          transition: "width 0.4s ease",
                        }}
                      ></div>
                    </>
                  ) : (
                    <div style={{ width: "100%", background: "var(--sf2)" }}></div>
                  )}
                </div>

                {/* Counts breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: "var(--ok)" }}></span>
                    <span style={{ flex: 1, color: "var(--mu)" }}>Operativas</span>
                    <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{operativas}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: "var(--wa)" }}></span>
                    <span style={{ flex: 1, color: "var(--mu)" }}>En mantención</span>
                    <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{enMantencion}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: "var(--er)" }}></span>
                    <span style={{ flex: 1, color: "var(--mu)" }}>Dadas de baja</span>
                    <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{dadasDeBaja}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

      {/* ============ MODAL NUEVO EVENTO ============ */}
      {modalNuevoEvento && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "var(--sf)",
              border: "1px solid var(--bd)",
              borderRadius: "20px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "var(--prs)",
                    color: "var(--lk)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
                    <path d="M8 2.5v4M16 2.5v4M3 10h18"></path>
                  </svg>
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Nueva Producción</h3>
              </div>
              <button
                onClick={() => setModalNuevoEvento(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--mu)",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearEvento} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--mu)" }}>Nombre del Evento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Festival Lollapalooza 2026"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="text-[16px] md:text-sm"
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--bd)",
                    background: "var(--sf2)",
                    color: "var(--tx)",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--mu)" }}>Locación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Parque O'Higgins, Santiago"
                  value={nuevaLocacion}
                  onChange={(e) => setNuevaLocacion(e.target.value)}
                  className="text-[16px] md:text-sm"
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--bd)",
                    background: "var(--sf2)",
                    color: "var(--tx)",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--mu)" }}>Superficie (m²)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={nuevosM2}
                    onChange={(e) => setNuevosM2(e.target.value)}
                    className="text-[16px] md:text-sm"
                    style={{
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--bd)",
                      background: "var(--sf2)",
                      color: "var(--tx)",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--mu)" }}>Fecha de Inicio</label>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="text-[16px] md:text-sm"
                    style={{
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--bd)",
                      background: "var(--sf2)",
                      color: "var(--tx)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--mu)" }}>Tipo de Instalación</label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value)}
                  className="text-[16px] md:text-sm"
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--bd)",
                    background: "var(--sf2)",
                    color: "var(--tx)",
                    outline: "none",
                  }}
                >
                  <option value="Pista de Baile LED">Pista de Baile LED</option>
                  <option value="Pista de Baile LED + Pirotecnia">Pista de Baile LED + Pirotecnia</option>
                  <option value="Pantalla Escenario P2.9">Pantalla Escenario P2.9</option>
                  <option value="Tótem LED Publicitario">Tótem LED Publicitario</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalNuevoEvento(false)}
                  style={{
                    height: "40px",
                    padding: "0 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--bd)",
                    background: "transparent",
                    color: "var(--mu)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEvento}
                  className="dash-btn"
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    borderRadius: "10px",
                    border: 0,
                    background: "var(--go)",
                    color: "var(--gt)",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {guardandoEvento ? "Registrando..." : "Crear Producción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
