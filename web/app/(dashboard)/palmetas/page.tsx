"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */
interface Palmeta {
  id: string;
  qr_uuid: string;
  codigo_visible: string;
  lote_fabricacion: string | null;
  estado: "operativo" | "mantencion" | "baja";
  ultima_revision: string | null;
  ubicacion_actual: string | null;
  created_at: string;
  updated_at: string;
}

type FiltroEstado = "todas" | "operativo" | "mantencion" | "baja";

/* ─── Estado Label Map ─── */
const ESTADO_CONFIG: Record<
  Palmeta["estado"],
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  operativo: {
    label: "Operativa",
    color: "var(--ok-text)",
    bg: "bg-[#DCFCE7] dark:bg-[var(--ok-badge-bg)] text-[#15803D] dark:text-[var(--ok-text)]",
    border: "border-[#BBF7D0] dark:border-[var(--ok)]/30",
    icon: "check_circle",
  },
  mantencion: {
    label: "En Mantención",
    color: "var(--wa-text)",
    bg: "bg-[#FEF3C7] dark:bg-[var(--wa-badge-bg)] text-[#B45309] dark:text-[var(--wa-text)]",
    border: "border-[#FDE68A] dark:border-[var(--wa)]/30",
    icon: "engineering",
  },
  baja: {
    label: "Baja Definitiva",
    color: "var(--er-text)",
    bg: "bg-[#FEE2E2] dark:bg-[var(--er-badge-bg)] text-[#B91C1C] dark:text-[var(--er-text)]",
    border: "border-[#FECACA] dark:border-[var(--er)]/30",
    icon: "cancel",
  },
};

const UBICACION_LABELS: Record<string, string> = {
  bodega_central: "Bodega Central",
  en_evento: "En Evento",
  taller: "Taller Técnico",
};

export default function PalmetasPage() {
  const supabase = createClient();

  /* ─── State ─── */
  const [palmetas, setPalmetas] = useState<Palmeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroEstado>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [palmetaSeleccionada, setPalmetaSeleccionada] = useState<Palmeta | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<Palmeta["estado"] | "">("");
  const [nuevaUbicacion, setNuevaUbicacion] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ─── Fetch Data ─── */
  const fetchPalmetas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("palmetas_led")
      .select("*")
      .order("codigo_visible", { ascending: true });

    if (!error && data) {
      setPalmetas(data as Palmeta[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPalmetas();

    // Suscripción en tiempo real a cambios en palmetas_led
    const channel = supabase
      .channel("palmetas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "palmetas_led" },
        () => {
          fetchPalmetas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPalmetas, supabase]);

  /* ─── Derived Metrics ─── */
  const totalPalmetas = palmetas.length;
  const operativas = palmetas.filter((p) => p.estado === "operativo").length;
  const enTaller = palmetas.filter((p) => p.estado === "mantencion").length;
  const deBaja = palmetas.filter((p) => p.estado === "baja").length;

  /* ─── Filtering ─── */
  const palmetasFiltradas = palmetas.filter((p) => {
    const coincideFiltro =
      filtro === "todas"
        ? true
        : p.estado === filtro;

    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      !q ||
      p.codigo_visible.toLowerCase().includes(q) ||
      p.qr_uuid.toLowerCase().includes(q) ||
      (p.lote_fabricacion || "").toLowerCase().includes(q) ||
      (p.ubicacion_actual || "").toLowerCase().includes(q);

    return coincideFiltro && coincideBusqueda;
  });

  /* ─── Update State Handler ─── */
  const handleUpdateEstado = async () => {
    if (!palmetaSeleccionada || !nuevoEstado) return;

    setCambiandoEstado(true);

    const updatePayload: Record<string, string> = {
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    };

    if (nuevaUbicacion) {
      updatePayload.ubicacion_actual = nuevaUbicacion;
    }

    // If setting to operativo, automatically set ultima_revision
    if (nuevoEstado === "operativo") {
      updatePayload.ultima_revision = new Date().toISOString();
    }

    const { error } = await supabase
      .from("palmetas_led")
      .update(updatePayload)
      .eq("id", palmetaSeleccionada.id);

    setCambiandoEstado(false);

    if (!error) {
      setSuccessMsg(
        `${palmetaSeleccionada.codigo_visible} actualizada a "${ESTADO_CONFIG[nuevoEstado as Palmeta["estado"]].label}"`
      );
      setPalmetaSeleccionada(null);
      setNuevoEstado("");
      setNuevaUbicacion("");
      fetchPalmetas();
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  /* ─── Open Detail ─── */
  const openDetail = (p: Palmeta) => {
    setPalmetaSeleccionada(p);
    setNuevoEstado("");
    setNuevaUbicacion(p.ubicacion_actual || "bodega_central");
  };

  return (
    <>
        {/* ── Ambient Glow ── */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--pr-glow)] rounded-full blur-[150px]" />
          <div className="absolute top-2/3 -right-40 w-[400px] h-[400px] bg-[#10B981]/5 rounded-full blur-[160px]" />
        </div>

        {/* ── Top Bar ── */}
        <header
          className="px-4 py-3 sm:px-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bd)] bg-[var(--sf)] sticky top-0 z-30"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/"
              style={{
                fontSize: "12px",
                color: "var(--mu)",
                fontWeight: 500,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Inicio
            </Link>
            <span style={{ color: "var(--bd)", fontSize: "12px" }}>/</span>
            <span
              style={{
                fontSize: "14px",
                color: "var(--tx)",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span className="material-symbols-outlined text-base" style={{ color: "var(--pr)" }}>
                grid_view
              </span>
              Inventario de Palmetas LED
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/palmetas/etiquetado"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[var(--pr)]/40 bg-[var(--prs)] text-[var(--pr)] text-xs font-bold hover:border-[var(--pr)] hover:brightness-110 active:scale-95 transition-all shadow-sm no-underline"
              title="Centro de Etiquetado y Serialización QR"
            >
              <span className="material-symbols-outlined text-base">
                qr_code_2
              </span>
              <span>Centro de Etiquetado QR</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchPalmetas()}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[var(--bd)] bg-[var(--sf2)] text-[var(--tx)] text-xs font-semibold hover:border-[var(--border-light)] active:scale-95 transition-all shadow-sm cursor-pointer"
              title="Recargar datos del inventario"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1">
        {/* Success Toast */}
        {successMsg && (
          <div className="fixed top-24 right-8 z-50 px-5 py-3 rounded-xl bg-[#10B981] text-white text-xs font-['Outfit'] font-semibold tracking-wide shadow-xl shadow-[#10B981]/20 flex items-center gap-2 animate-fade-in-up">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Title Banner (Limpio y directo, sin botones duplicados) */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--prs)] border border-[var(--pr)]/25 text-[var(--pr)] text-[11px] font-['Outfit'] font-semibold tracking-wider uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--go)]" />
            Activos Serializados con QR
          </div>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--tx)]">
            Parque de Palmetas LED
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 max-w-2xl">
            Registro, trazabilidad y gestión de estado de las baldosas LED del inventario centralizado.
          </p>
        </div>

        {/* ── KPIs ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[var(--bd)] card-shadow transition-shadow flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[var(--mu)] font-semibold">
                Total Parque
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {totalPalmetas}
              </span>
              <span className="text-[11px] text-[#71717A] mt-0.5">Unidades registradas</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--kpi-total-icon-bg)] border border-[var(--kpi-total-icon-border)] text-[var(--kpi-total-icon-color)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">grid_view</span>
            </div>
          </div>

          {/* Operativas */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[#10B981]/30 card-shadow transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#10B981]/[0.05] dark:from-[#10B981]/10 to-transparent pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[#10B981] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Operativas
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {operativas}
              </span>
              <span className="text-[11px] text-[#10B981]/80 mt-0.5">Listas para montaje</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-[#10B981]/15 dark:border-[#10B981]/30 dark:text-[#10B981] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>

          {/* En Mantención */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[#F59E0B]/25 card-shadow transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-amber-500/[0.05] dark:from-[#F59E0B]/08 to-transparent pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[#F59E0B] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                En Mantención
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {enTaller}
              </span>
              <span className="text-[11px] text-[#F59E0B]/80 mt-0.5">En taller o con avería</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 dark:bg-[#F59E0B]/12 dark:border-[#F59E0B]/25 dark:text-[#F59E0B] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">engineering</span>
            </div>
          </div>

          {/* De Baja */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[#EF4444]/25 card-shadow transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-red-500/[0.05] dark:from-[#EF4444]/08 to-transparent pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[#EF4444] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                De Baja
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {deBaja}
              </span>
              <span className="text-[11px] text-[#EF4444]/80 mt-0.5">Fuera de servicio</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 dark:bg-[#EF4444]/12 dark:border-[#EF4444]/25 dark:text-[#EF4444] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
          </div>
        </section>

        {/* ── Filter Bar ── */}
        <div className="p-4 rounded-xl bg-white dark:bg-[var(--sf)] border border-slate-200 dark:border-[var(--bd)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 card-shadow transition-shadow">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-[var(--sf2)] p-1 rounded-lg border border-[var(--bd)] overflow-x-auto">
            {(
              [
                { key: "todas", label: `Todas (${totalPalmetas})` },
                { key: "operativo", label: `Operativas (${operativas})`, dot: "#10B981" },
                { key: "mantencion", label: `En Mantención (${enTaller})`, dot: "#F59E0B" },
                { key: "baja", label: `Baja (${deBaja})`, dot: "#EF4444" },
              ] as { key: FiltroEstado; label: string; dot?: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFiltro(tab.key)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-['Outfit'] font-semibold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filtro === tab.key
                    ? tab.key === "todas"
                      ? "bg-[var(--go)] text-[var(--gt)] shadow-sm"
                      : tab.key === "operativo"
                      ? "bg-[#10B981] text-white shadow-sm"
                      : tab.key === "mantencion"
                      ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-[#78580a] dark:text-[#F7EEDB] dark:border-[#F59E0B]/40 shadow-sm"
                      : "bg-red-100 text-red-800 border border-red-200 dark:bg-[#4a1c1a] dark:text-[#F7EEDB] dark:border-[#EF4444]/40 shadow-sm"
                    : "text-[var(--mu)] hover:text-[var(--tx)]"
                }`}
              >
                {tab.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tab.dot }} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código (PL-001), UUID o lote..."
              className="w-full h-10 pl-10 pr-4 bg-[var(--sf2)] border border-[var(--bd)] rounded-lg text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--pr)] focus:ring-1 focus:ring-[var(--pr)]/30 transition-all"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="w-full rounded-2xl bg-white dark:bg-[var(--sf)] border border-slate-200 dark:border-[var(--bd)] card-shadow overflow-hidden">
          <div className="w-full overflow-x-auto pb-2">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[var(--bd)] bg-slate-50 dark:bg-[#16161a] text-slate-500 dark:text-[var(--mu)] font-['Outfit'] uppercase tracking-wider font-semibold text-xs">
                  <th className="py-3.5 px-4 sm:px-6">Código / UUID</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Lote</th>
                  <th className="py-3.5 px-4">Ubicación</th>
                  <th className="py-3.5 px-4">Última Revisión</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-[var(--pr)] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-[#71717A]">Cargando inventario desde Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : palmetasFiltradas.length > 0 ? (
                  palmetasFiltradas.map((p) => {
                    const cfg = ESTADO_CONFIG[p.estado];
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-[var(--sf2)]/50 transition-colors group"
                      >
                        {/* Código / UUID */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="min-w-[56px] h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-[var(--sf2)] border border-slate-200 dark:border-[var(--bd)] flex items-center justify-center text-[var(--pr)] font-['Outfit'] font-bold text-xs tracking-wide shadow-inner shrink-0">
                              {p.codigo_visible}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-[var(--tx)] group-hover:text-[var(--pr)] transition-colors">
                                {p.codigo_visible}
                              </span>
                              <span className="font-mono text-[10px] text-[#71717A]">
                                {p.qr_uuid.substring(0, 18)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.border} border font-['Outfit'] font-semibold text-[10.5px] uppercase tracking-wider`}
                            style={{ color: cfg.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: cfg.color }}
                            />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Lote */}
                        <td className="py-4 px-4">
                          <span className="text-xs text-[var(--mu)] font-medium">
                            {p.lote_fabricacion || "—"}
                          </span>
                        </td>

                        {/* Ubicación */}
                        <td className="py-4 px-4">
                          <span className="text-xs text-[var(--mu)]">
                            {UBICACION_LABELS[p.ubicacion_actual || ""] || p.ubicacion_actual || "—"}
                          </span>
                        </td>

                        {/* Última Revisión */}
                        <td className="py-4 px-4">
                          <span className="text-xs text-[var(--mu)]">
                            {p.ultima_revision
                              ? new Date(p.ultima_revision).toLocaleDateString("es-CL", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Sin revisión"}
                          </span>
                        </td>

                        {/* Acción */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            type="button"
                            onClick={() => openDetail(p)}
                            className="px-3 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-[var(--sf2)] dark:border-[var(--bd)] dark:text-[var(--mu)] dark:hover:text-[var(--pr)]"
                          >
                            <span className="material-symbols-outlined text-sm">
                              open_in_new
                            </span>
                            <span>Gestionar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[#71717A]">
                      {totalPalmetas === 0
                        ? "No hay palmetas registradas en la base de datos. Las palmetas se enrolan desde la App Móvil con escaneo QR."
                        : "No se encontraron palmetas con los filtros seleccionados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && palmetasFiltradas.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 dark:border-[var(--bd)] bg-slate-50 dark:bg-[#16161a] flex items-center justify-between">
              <span className="text-[11px] text-[#71717A] font-['Outfit']">
                Mostrando {palmetasFiltradas.length} de {totalPalmetas} palmetas
              </span>
              <span className="text-[10px] text-[var(--pr)] font-['Outfit'] uppercase tracking-wider font-semibold">
                Datos en tiempo real • Supabase Cloud
              </span>
            </div>
          )}
        </div>
      </main>

      {/* ── Detail / State-Change Modal ── */}
      {palmetaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--sf)] border border-[var(--bd)] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-4">
              <div className="flex items-center gap-3">
                <div className="min-w-[64px] h-10 px-3 rounded-xl bg-[var(--prs)] border border-[var(--pr)]/30 flex items-center justify-center text-[var(--pr)] font-['Outfit'] font-bold text-sm tracking-wide shrink-0">
                  {palmetaSeleccionada.codigo_visible}
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-semibold text-[var(--tx)]">
                    Ficha Técnica — {palmetaSeleccionada.codigo_visible}
                  </h3>
                  <span className="text-[11px] text-[#71717A] font-mono">
                    {palmetaSeleccionada.qr_uuid}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPalmetaSeleccionada(null)}
                className="w-8 h-8 rounded-lg bg-[var(--sf2)] hover:bg-[var(--sf2)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--sf2)]/60 p-4 rounded-xl border border-[var(--bd)]">
              <div>
                <span className="text-[#71717A] block">Estado Actual:</span>
                <span
                  className="font-semibold mt-0.5 block"
                  style={{ color: ESTADO_CONFIG[palmetaSeleccionada.estado].color }}
                >
                  {ESTADO_CONFIG[palmetaSeleccionada.estado].label}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Ubicación:</span>
                <span className="font-medium text-[var(--tx)] mt-0.5 block">
                  {UBICACION_LABELS[palmetaSeleccionada.ubicacion_actual || ""] ||
                    palmetaSeleccionada.ubicacion_actual ||
                    "Sin asignar"}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Lote de Fabricación:</span>
                <span className="text-[var(--tx)] mt-0.5 block">
                  {palmetaSeleccionada.lote_fabricacion || "No registrado"}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Última Revisión:</span>
                <span className="text-[var(--tx)] mt-0.5 block">
                  {palmetaSeleccionada.ultima_revision
                    ? new Date(palmetaSeleccionada.ultima_revision).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Sin revisión registrada"}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Fecha de Alta:</span>
                <span className="text-[var(--tx)] mt-0.5 block">
                  {new Date(palmetaSeleccionada.created_at).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Código QR (UUID):</span>
                <span className="text-[var(--pr)] mt-0.5 block font-mono text-[10px]">
                  {palmetaSeleccionada.qr_uuid}
                </span>
              </div>
            </div>

            {/* State Change Form */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                Cambiar Estado Operativo
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["operativo", "mantencion", "baja"] as Palmeta["estado"][]).map(
                  (estado) => {
                    const cfg = ESTADO_CONFIG[estado];
                    const isSelected = nuevoEstado === estado;
                    const isCurrent = palmetaSeleccionada.estado === estado;
                    return (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => setNuevoEstado(estado)}
                        disabled={isCurrent}
                        className={`px-3 py-2.5 rounded-xl text-xs font-['Outfit'] font-semibold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer border ${
                          isCurrent
                            ? "opacity-40 cursor-not-allowed bg-[var(--sf2)] border-[var(--bd)] text-[#71717A]"
                            : isSelected
                            ? `${cfg.bg} ${cfg.border} card-shadow transition-shadow`
                            : "bg-[var(--sf2)] border-[var(--bd)] text-[var(--mu)] hover:text-[var(--tx)] hover:border-[var(--border-light)]"
                        }`}
                        style={isSelected && !isCurrent ? { color: cfg.color } : undefined}
                      >
                        <span className="material-symbols-outlined text-base">{cfg.icon}</span>
                        {cfg.label}
                        {isCurrent && (
                          <span className="text-[9px] ml-auto opacity-60">(actual)</span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Ubicación Selector */}
              {nuevoEstado && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <label
                    htmlFor="ubicacion-select"
                    className="text-[11px] text-[#71717A] font-['Outfit'] uppercase tracking-wider"
                  >
                    Ubicación tras el cambio:
                  </label>
                  <select
                    id="ubicacion-select"
                    value={nuevaUbicacion}
                    onChange={(e) => setNuevaUbicacion(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-lg text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] focus:ring-1 focus:ring-[var(--pr)]/30 transition-all cursor-pointer"
                  >
                    <option value="bodega_central">Bodega Central</option>
                    <option value="en_evento">En Evento</option>
                    <option value="taller">Taller Técnico</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--bd)]">
              <button
                type="button"
                onClick={() => setPalmetaSeleccionada(null)}
                className="px-4 py-2 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf2)] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[var(--mu)] hover:text-[var(--tx)] transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              {nuevoEstado && (
                <button
                  type="button"
                  disabled={cambiandoEstado}
                  onClick={handleUpdateEstado}
                  className="px-4 py-2 rounded-xl bg-[var(--go)] hover:brightness-105 text-[var(--gt)] text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all shadow-lg shadow-[var(--pr)]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {cambiandoEstado ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      Confirmar Cambio de Estado
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "16px 32px",
          borderTop: "1px solid var(--bd)",
          background: "var(--bg)",
          fontSize: "12px",
          color: "var(--mu)",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span>Alejandra Producciones SpA • Dirección y Operaciones Técnicas</span>
          <span className="font-['Outfit'] text-[10px] uppercase tracking-wider text-[var(--pr)] font-semibold">
            Módulo de Inventario Palmetas LED v1.0
          </span>
        </div>
      </footer>
    </>
  );
}
