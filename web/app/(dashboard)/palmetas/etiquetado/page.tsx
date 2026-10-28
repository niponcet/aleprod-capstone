"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";

/* ─── Interfaces ─── */
interface StickerItem {
  id?: string;
  qr_uuid: string;
  codigo_visible: string;
  lote: string;
  estado?: string;
  isExisting?: boolean;
}

interface PalmetaBD {
  id: string;
  qr_uuid: string;
  codigo_visible: string;
  lote_fabricacion: string | null;
  lote_ingreso: string | null;
  estado: string;
  ubicacion_actual: string | null;
  created_at: string;
}

/* ─── Helper de Código Visible Determinista ─── */
function deriveCodigoVisible(qrUuid: string): string {
  const clean = (qrUuid || "").replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length >= 6) {
    return `PL-${clean.slice(-6).toUpperCase()}`;
  }
  if (clean.length > 0) {
    return `PL-${clean.padStart(6, "0").toUpperCase()}`;
  }
  return "PL-000000";
}

/* ─── Generador de Lote Mensual por Defecto ─── */
function getDefaultLote(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `LOTE-${mm}${yyyy}`;
}

export default function CentroEtiquetadoPage() {
  const supabase = createClient();

  /* ─── Estados Principales ─── */
  const [tabActiva, setTabActiva] = useState<"nuevo" | "reimpresion">("nuevo");
  const [loteReferencia, setLoteReferencia] = useState(getDefaultLote());
  const [cantidadStickers, setCantidadStickers] = useState(24);
  const [stickersNuevos, setStickersNuevos] = useState<StickerItem[]>([]);
  const [stickerZoom, setStickerZoom] = useState<StickerItem | null>(null);
  const [copiadoToast, setCopiadoToast] = useState("");

  /* ─── Estados de Reimpresión (Supabase) ─── */
  const [palmetasBD, setPalmetasBD] = useState<PalmetaBD[]>([]);
  const [busquedaBD, setBusquedaBD] = useState("");
  const [cargandoBD, setCargandoBD] = useState(false);
  const [seleccionadosBD, setSeleccionadosBD] = useState<Record<string, boolean>>({});

  /* ─── Generación de Stickers Vírgenes (Sin INSERT a BD) ─── */
  const generarLoteVirgen = useCallback((qty: number, lote: string) => {
    const list: StickerItem[] = [];
    for (let i = 0; i < qty; i++) {
      const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `aleprod-${Date.now()}-${i}`;
      list.push({
        qr_uuid: uuid,
        codigo_visible: deriveCodigoVisible(uuid),
        lote: lote.trim() || getDefaultLote(),
        isExisting: false,
      });
    }
    setStickersNuevos(list);
  }, []);

  // Generar lote inicial en montaje
  useEffect(() => {
    generarLoteVirgen(cantidadStickers, loteReferencia);
  }, [generarLoteVirgen, cantidadStickers, loteReferencia]);

  /* ─── Carga de Palmetas Registradas para Reimpresión ─── */
  const fetchPalmetasBD = useCallback(async () => {
    setCargandoBD(true);
    const { data, error } = await supabase
      .from("palmetas_led")
      .select("id, qr_uuid, codigo_visible, lote_fabricacion, lote_ingreso, estado, ubicacion_actual, created_at")
      .order("codigo_visible", { ascending: true });

    if (!error && data) {
      setPalmetasBD(data as PalmetaBD[]);
    }
    setCargandoBD(false);
  }, [supabase]);

  useEffect(() => {
    if (tabActiva === "reimpresion" && palmetasBD.length === 0) {
      fetchPalmetasBD();
    }
  }, [tabActiva, palmetasBD.length, fetchPalmetasBD]);

  /* ─── Palmetas Filtradas para Reimpresión ─── */
  const palmetasBDFiltradas = useMemo(() => {
    if (!busquedaBD.trim()) return palmetasBD;
    const q = busquedaBD.toLowerCase();
    return palmetasBD.filter(
      (p) =>
        (p.codigo_visible && p.codigo_visible.toLowerCase().includes(q)) ||
        (p.qr_uuid && p.qr_uuid.toLowerCase().includes(q)) ||
        (p.lote_fabricacion && p.lote_fabricacion.toLowerCase().includes(q)) ||
        (p.lote_ingreso && p.lote_ingreso.toLowerCase().includes(q))
    );
  }, [palmetasBD, busquedaBD]);

  /* ─── Lista de Stickers Seleccionados para Reimpresión ─── */
  const stickersReimpresion: StickerItem[] = useMemo(() => {
    return palmetasBD
      .filter((p) => seleccionadosBD[p.id])
      .map((p) => ({
        id: p.id,
        qr_uuid: p.qr_uuid,
        codigo_visible: p.codigo_visible || deriveCodigoVisible(p.qr_uuid),
        lote: p.lote_fabricacion || p.lote_ingreso || "LOTE-ACTIVO",
        estado: p.estado,
        isExisting: true,
      }));
  }, [palmetasBD, seleccionadosBD]);

  /* ─── Selección / Deselección en Lote ─── */
  const toggleSeleccion = (id: string) => {
    setSeleccionadosBD((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const seleccionarTodosFiltrados = () => {
    const next: Record<string, boolean> = { ...seleccionadosBD };
    palmetasBDFiltradas.forEach((p) => {
      next[p.id] = true;
    });
    setSeleccionadosBD(next);
  };

  const deseleccionarTodos = () => {
    setSeleccionadosBD({});
  };

  /* ─── Copiar UUID al portapapeles ─── */
  const copiarAlPortapapeles = (texto: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(texto);
      setCopiadoToast(`Copiado: ${label}`);
      setTimeout(() => setCopiadoToast(""), 3000);
    }
  };

  /* ─── Ejecutar Impresión ─── */
  const handleImprimir = () => {
    window.print();
  };

  // Determinar qué stickers entran en la planilla activa
  const stickersActivos = tabActiva === "nuevo" ? stickersNuevos : stickersReimpresion;

  return (
    <>
      {/* ── Toast de Copiado ── */}
      {copiadoToast && (
        <div className="fixed top-24 right-8 z-50 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0A] text-xs font-['Outfit'] font-bold tracking-wide shadow-2xl flex items-center gap-2 animate-fade-in-up print:hidden">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {copiadoToast}
        </div>
      )}

      {/* ── Estilos CSS Especiales para Modo Impresión Física ── */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 10mm 8mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ocultar elementos de navegación y UI en impresión */
          aside,
          header,
          footer,
          .print-hidden,
          .ambient-glow {
            display: none !important;
          }
          /* Contenedor de impresión */
          .print-sheet-container {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 4mm !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
          }
          /* Etiqueta individual para sticker autoadhesivo */
          .print-label-item {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            border: 1px dashed #71717a !important;
            border-radius: 4px !important;
            padding: 2.5mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: 32mm !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* ── Ambient Glow (Solo pantalla) ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden ambient-glow print:hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#D4AF37]/8 rounded-full blur-[150px]" />
        <div className="absolute top-2/3 -right-40 w-[400px] h-[400px] bg-[#10B981]/5 rounded-full blur-[160px]" />
      </div>

      {/* ── Top Bar / Header Ejecutivo ── */}
      <header
        className="px-4 py-3 sm:px-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bd)] bg-[var(--sf)] sticky top-0 z-30 print:hidden"
      >
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              color: "var(--mu)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Inicio
          </Link>
          <span style={{ color: "var(--bd)", fontSize: "12px" }}>/</span>
          <Link
            href="/palmetas"
            style={{
              fontSize: "12px",
              color: "var(--mu)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Palmetas LED
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
              qr_code_2
            </span>
            Centro de Etiquetado y Serialización QR
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/palmetas"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "38px",
              padding: "0 14px",
              borderRadius: "10px",
              border: "1px solid var(--bd)",
              background: "var(--sf2)",
              color: "var(--tx)",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            className="hover:border-[#3F3F46]"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver al Inventario
          </Link>

          <button
            type="button"
            onClick={handleImprimir}
            disabled={stickersActivos.length === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "38px",
              padding: "0 18px",
              borderRadius: "10px",
              border: "1px solid #D4AF37",
              background: "linear-gradient(135deg, #D4AF37 0%, #C5A059 100%)",
              color: "#0A0A0A",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: stickersActivos.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 2px 10px rgba(212,175,55,0.25)",
              opacity: stickersActivos.length === 0 ? 0.4 : 1,
            }}
            className="active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            <span>Imprimir Planilla / PDF ({stickersActivos.length})</span>
          </button>
        </div>
      </header>

      {/* ── Main Viewport ── */}
      <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1">
        {/* Banner de Presentación */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-[11px] font-['Outfit'] font-semibold tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              Emisión de Identidad Física para Palmetas LED
            </div>
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF]">
              Centro de Etiquetado y Serialización QR
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-3xl">
              Genera planillas listas para impresión láser/adhesiva con códigos QR vectoriales y códigos cortos legibles (<code className="text-[#D4AF37] font-mono font-semibold">PL-XXXXXX</code>). Las palmetas vírgenes no tocan la BD hasta ser escaneadas en terreno con el Modo Ráfaga (HU-13).
            </p>
          </div>

          {/* KPI Resumen */}
          <div className="p-3.5 px-5 rounded-2xl bg-[#121212] border border-[#27272A] flex items-center gap-4 self-start md:self-auto shrink-0 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10.5px] uppercase font-['Outfit'] tracking-wider text-[#A1A1AA] font-semibold">
                Stickers en Planilla
              </span>
              <span className="text-2xl font-bold font-['Outfit'] text-[#FFFFFF] leading-tight">
                {stickersActivos.length}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs Selector ── */}
        <div className="flex items-center gap-2 border-b border-[#27272A] pb-3 print:hidden">
          <button
            type="button"
            onClick={() => setTabActiva("nuevo")}
            className={`px-4 py-2 rounded-xl text-xs font-['Outfit'] font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === "nuevo"
                ? "bg-[#D4AF37] text-[#0A0A0A] shadow-md shadow-[#D4AF37]/20"
                : "bg-[#1E1E1E] text-[#A1A1AA] hover:text-[#FFFFFF] border border-[#27272A]"
            }`}
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Pestaña 1 — Emisión de Lote Nuevo (Stickers Vírgenes)
          </button>

          <button
            type="button"
            onClick={() => setTabActiva("reimpresion")}
            className={`px-4 py-2 rounded-xl text-xs font-['Outfit'] font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === "reimpresion"
                ? "bg-[#D4AF37] text-[#0A0A0A] shadow-md shadow-[#D4AF37]/20"
                : "bg-[#1E1E1E] text-[#A1A1AA] hover:text-[#FFFFFF] border border-[#27272A]"
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            Pestaña 2 — Reimpresión por Deterioro (Activos en Supabase)
            {stickersReimpresion.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#10B981] text-white">
                {stickersReimpresion.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB 1: Emisión de Lote Nuevo ── */}
        {tabActiva === "nuevo" && (
          <div className="flex flex-col gap-5 print:hidden">
            {/* Panel de Configuración de Lote */}
            <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272A] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Lote */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-['Outfit'] uppercase tracking-wider text-[#A1A1AA] font-semibold">
                    Lote de Fabricación / Ingreso:
                  </label>
                  <input
                    type="text"
                    value={loteReferencia}
                    onChange={(e) => setLoteReferencia(e.target.value.toUpperCase())}
                    placeholder="LOTE-102026"
                    className="h-10 px-3.5 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-xs font-mono font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] w-40"
                  />
                </div>

                {/* Cantidad Rápida */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-['Outfit'] uppercase tracking-wider text-[#A1A1AA] font-semibold">
                    Cantidad a Emitir:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[12, 24, 48, 96].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setCantidadStickers(num);
                          generarLoteVirgen(num, loteReferencia);
                        }}
                        className={`h-10 px-3 rounded-xl text-xs font-['Outfit'] font-bold transition-all cursor-pointer border ${
                          cantidadStickers === num
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                            : "bg-[#1E1E1E] border-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={cantidadStickers}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(120, Number(e.target.value) || 1));
                        setCantidadStickers(val);
                        generarLoteVirgen(val, loteReferencia);
                      }}
                      className="h-10 w-20 px-2.5 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-xs font-['Outfit'] text-center text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                      title="Cantidad personalizada (1 a 120)"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Regenerar */}
              <button
                type="button"
                onClick={() => generarLoteVirgen(cantidadStickers, loteReferencia)}
                className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-[#27272A] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Generar Nuevos UUIDs
              </button>
            </div>

            {/* Aviso de Regla de Negocio */}
            <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#10B981] text-xl mt-0.5">verified_user</span>
              <div className="flex flex-col text-xs text-[#A1A1AA] leading-relaxed">
                <span className="font-['Outfit'] font-semibold text-[#FFFFFF] text-xs">
                  Regla de Negocio Offline-First Garantizada
                </span>
                Estos stickers contienen UUIDs v4 vírgenes con su código visible derivado (<code className="text-[#D4AF37] font-mono">PL-XXXXXX</code>). <strong>No se han insertado filas en Supabase</strong>, protegiendo el inventario de registros huérfanos. Al pegar la etiqueta en la palmeta y escanearla con la App Móvil (Modo Ráfaga HU-13), el técnico dará de alta el equipo de forma atómica.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Reimpresión por Deterioro ── */}
        {tabActiva === "reimpresion" && (
          <div className="flex flex-col gap-5 print:hidden">
            {/* Buscador y Controles de Selección */}
            <div className="p-4 rounded-2xl bg-[#121212] border border-[#27272A] shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={busquedaBD}
                  onChange={(e) => setBusquedaBD(e.target.value)}
                  placeholder="Buscar activo por PL-001, UUID o Lote..."
                  className="w-full h-10 pl-10 pr-4 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] placeholder-[#71717A] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={seleccionarTodosFiltrados}
                  className="px-3.5 py-2 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-[#27272A] text-xs font-['Outfit'] font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
                >
                  Seleccionar Todo ({palmetasBDFiltradas.length})
                </button>
                <button
                  type="button"
                  onClick={deseleccionarTodos}
                  disabled={stickersReimpresion.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-[#27272A] text-xs font-['Outfit'] font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer disabled:opacity-40"
                >
                  Limpiar Selección
                </button>
                <button
                  type="button"
                  onClick={fetchPalmetasBD}
                  className="p-2 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
                  title="Recargar desde Supabase"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
              </div>
            </div>

            {/* Tabla de Selección de Palmetas Registradas */}
            <div className="rounded-2xl bg-[#121212] border border-[#27272A] shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              <div className="w-full overflow-x-auto pb-2">
                <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#27272A] bg-[#16161a] text-[#A1A1AA] font-['Outfit'] uppercase tracking-wider font-semibold sticky top-0 z-10">
                      <th className="py-3 px-4 w-12 text-center">Sel.</th>
                      <th className="py-3 px-4">Código Visible / UUID</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Lote</th>
                      <th className="py-3 px-4">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {cargandoBD ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#71717A]">
                          Consultando activos en Supabase Cloud...
                        </td>
                      </tr>
                    ) : palmetasBDFiltradas.length > 0 ? (
                      palmetasBDFiltradas.map((p) => {
                        const isChecked = !!seleccionadosBD[p.id];
                        return (
                          <tr
                            key={p.id}
                            onClick={() => toggleSeleccion(p.id)}
                            className={`cursor-pointer transition-colors ${
                              isChecked ? "bg-[#D4AF37]/10" : "hover:bg-[#1E1E1E]/50"
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Manejado por tr onClick
                                className="accent-[#D4AF37] w-4 h-4 cursor-pointer rounded"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-['Outfit'] font-bold text-xs text-[#D4AF37]">
                                  {p.codigo_visible}
                                </span>
                                <span className="font-mono text-[10px] text-[#71717A]">
                                  ({p.qr_uuid})
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize text-[11px] text-[#A1A1AA]">{p.estado}</span>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-[#A1A1AA]">
                              {p.lote_fabricacion || p.lote_ingreso || "—"}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-[#A1A1AA]">
                              {p.ubicacion_actual || "Bodega"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#71717A]">
                          No se encontraron palmetas con ese filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {stickersReimpresion.length > 0 && (
              <div className="p-3.5 px-4 rounded-xl bg-[#1E1E1E] border border-[#27272A] flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA]">
                  <strong className="text-[#D4AF37]">{stickersReimpresion.length}</strong> palmetas seleccionadas para reimpresión física de reemplazo.
                </span>
                <span className="text-[#10B981] font-['Outfit'] font-semibold">
                  Listas para imprimir en PDF
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── SECCIÓN DE STICKERS (Visualización en Pantalla y Grilla de Impresión) ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between print:hidden">
            <h2 className="font-['Outfit'] text-base font-semibold text-[#FFFFFF] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#D4AF37]">style</span>
              Vista Previa de Planilla ({stickersActivos.length} etiquetas)
            </h2>
            <span className="text-xs text-[#71717A]">
              Haz clic en cualquier sticker para abrir el <strong>Modo Escaneo en Pantalla</strong>
            </span>
          </div>

          {/* Grilla de Stickers en Pantalla (Diseño Oscuro) y en Impresión (Fondo Blanco) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 print-sheet-container">
            {stickersActivos.map((item, idx) => (
              <div
                key={`${item.qr_uuid}-${idx}`}
                onClick={() => setStickerZoom(item)}
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                className="group relative p-4 rounded-2xl bg-[#121212] border border-[#27272A] hover:border-[#D4AF37]/60 hover:shadow-xl hover:shadow-[#D4AF37]/10 flex flex-col gap-3 print-label-item"
                title="Clic para ver QR gigante y probar escaneo desde el monitor"
              >
                {/* Header Sticker */}
                <div className="flex items-center justify-between border-b border-[#27272A] pb-2 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    <span className="font-['Outfit'] font-bold text-[10px] tracking-wider text-[#FFFFFF] uppercase">
                      ALEPROD · LED
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-[#71717A] bg-[#1E1E1E] px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                </div>

                {/* Body Sticker: QR + Info */}
                <div className="flex items-center gap-3 w-full">
                  {/* QR SVG Vectorial */}
                  <div className="p-1.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
                    <QRCodeSVG
                      value={item.qr_uuid}
                      size={68}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Datos del Activo */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-['Outfit'] font-black text-lg text-[#D4AF37] tracking-tight group-hover:scale-105 transition-transform origin-left">
                      {item.codigo_visible}
                    </span>
                    <span className="text-[10px] font-['Outfit'] text-[#A1A1AA] uppercase tracking-wider font-semibold mt-0.5">
                      {item.lote}
                    </span>
                    <span className="font-mono text-[9px] text-[#71717A] truncate mt-1" title={item.qr_uuid}>
                      {item.qr_uuid.substring(0, 14)}...
                    </span>
                  </div>
                </div>

                {/* Footer Sticker */}
                <div className="flex items-center justify-between pt-2 border-t border-[#27272A] text-[9.5px] text-[#71717A] print:hidden">
                  <span className="flex items-center gap-1 text-[#D4AF37]">
                    <span className="material-symbols-outlined text-xs">zoom_in</span>
                    Probar Escaneo
                  </span>
                  <span>{item.isExisting ? "Reimpresión" : "Por Enrolar"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── MODAL DE VISTA ESCANEO EN PANTALLA (DEMO EN VIVO) ── */}
      {stickerZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 print:hidden">
          <div className="w-full max-w-md bg-[#121212] border border-[#27272A] rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-5 animate-fade-in-up">
            {/* Cabecera Modal */}
            <div className="flex items-center justify-between w-full border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37] text-2xl">qr_code_scanner</span>
                <span className="font-['Outfit'] font-bold text-sm text-[#FFFFFF] uppercase tracking-wider">
                  Simulador de Enrolamiento en Vivo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStickerZoom(null)}
                className="w-8 h-8 rounded-lg bg-[#1E1E1E] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Código Grande */}
            <div className="flex flex-col items-center">
              <span className="font-['Outfit'] font-black text-3xl text-[#D4AF37] tracking-wider">
                {stickerZoom.codigo_visible}
              </span>
              <span className="text-xs font-['Outfit'] uppercase tracking-widest text-[#A1A1AA] font-semibold mt-0.5">
                {stickerZoom.lote} • {stickerZoom.isExisting ? "Activo Registrado" : "UUID Virgen"}
              </span>
            </div>

            {/* QR Gigante en Ultra Alto Contraste (Fondo Blanco Puro) */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-[#D4AF37] flex items-center justify-center">
              <QRCodeSVG
                value={stickerZoom.qr_uuid}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Instrucción para el Celular */}
            <div className="p-3.5 rounded-xl bg-[#1E1E1E] border border-[#27272A] text-center w-full">
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                📱 <strong className="text-white">Apunta tu celular a este monitor:</strong> Abre la app de Alejandra Producciones en <strong>Modo Ráfaga (HU-13)</strong> o <strong>Modo Inspección</strong> para escanear y enrolar de inmediato esta palmeta.
              </p>
            </div>

            {/* UUID Completo con Botón de Copiado */}
            <div className="flex items-center justify-between w-full p-2.5 px-3 rounded-xl bg-[#0A0A0A] border border-[#27272A] text-xs">
              <span className="font-mono text-[10.5px] text-[#71717A] truncate mr-2" title={stickerZoom.qr_uuid}>
                {stickerZoom.qr_uuid}
              </span>
              <button
                type="button"
                onClick={() => copiarAlPortapapeles(stickerZoom.qr_uuid, stickerZoom.codigo_visible)}
                className="px-2.5 py-1 rounded-lg bg-[#1E1E1E] hover:bg-[#27272A] text-[10.5px] font-['Outfit'] text-[#D4AF37] hover:text-white uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                Copiar
              </button>
            </div>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setStickerZoom(null)}
              className="w-full py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[#FFFFFF] transition-colors cursor-pointer mt-1"
            >
              Cerrar Vista Escáner
            </button>
          </div>
        </div>
      )}
    </>
  );
}
