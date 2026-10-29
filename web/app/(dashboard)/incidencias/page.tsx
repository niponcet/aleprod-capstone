"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Interfaces ─── */
interface Incidencia {
  id: string;
  palmeta_id: string | null;
  qr_uuid: string;
  evento_id: string | null;
  tecnico_id: string | null;
  tipo_falla: string;
  descripcion?: string | null;
  foto_url?: string | null;
  fecha_ocurrencia: string;
  resuelto: boolean;
  solucion_tecnica?: string | null;
  created_at: string;
  // Joins relacionales
  codigo_palmeta: string;
  evento_nombre: string;
  tecnico_nombre: string;
}

interface PalmetaOpcion {
  id: string;
  codigo_visible: string;
  qr_uuid: string;
}

interface EventoOpcion {
  id: string;
  nombre: string;
}

export default function IncidenciasPage() {
  const supabase = createClient();

  /* ─── Estados ─── */
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "pendientes" | "resueltas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [solucionInput, setSolucionInput] = useState("");
  const [resolviendo, setResolviendo] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  /* ─── Modal Nueva Incidencia ─── */
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [palmetasDisponibles, setPalmetasDisponibles] = useState<PalmetaOpcion[]>([]);
  const [eventosDisponibles, setEventosDisponibles] = useState<EventoOpcion[]>([]);
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [nuevaPalmetaId, setNuevaPalmetaId] = useState("");
  const [nuevoEventoId, setNuevoEventoId] = useState("");
  const [nuevoTipoFalla, setNuevoTipoFalla] = useState("Módulo LED Quemado");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");

  /* ─── Carga de Datos desde Supabase ─── */
  const fetchIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("incidencias")
        .select(`
          id,
          palmeta_id,
          qr_uuid,
          evento_id,
          tecnico_id,
          tipo_falla,
          descripcion,
          foto_url,
          fecha_ocurrencia,
          resuelto,
          solucion_tecnica,
          created_at,
          palmetas_led ( codigo_visible ),
          eventos ( nombre ),
          perfiles:tecnico_id ( nombre_completo )
        `)
        .order("fecha_ocurrencia", { ascending: false });

      if (error) {
        console.error("Error al obtener incidencias:", error);
      } else if (data) {
        // Mapear resultado relacional a estructura amigable
        const mapeadas: Incidencia[] = data.map((item: any) => ({
          id: item.id,
          palmeta_id: item.palmeta_id,
          qr_uuid: item.qr_uuid,
          evento_id: item.evento_id,
          tecnico_id: item.tecnico_id,
          tipo_falla: item.tipo_falla,
          descripcion: item.descripcion,
          foto_url: item.foto_url,
          fecha_ocurrencia: item.fecha_ocurrencia,
          resuelto: item.resuelto,
          solucion_tecnica: item.solucion_tecnica,
          created_at: item.created_at,
          codigo_palmeta: item.palmetas_led?.codigo_visible || "Palmeta N/A",
          evento_nombre: item.eventos?.nombre || "Evento no asignado",
          tecnico_nombre: item.perfiles?.nombre_completo || "Técnico en Terreno",
        }));
        setIncidencias(mapeadas);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /* ─── Cargar Catálogos para Crear Incidencias ─── */
  const fetchCatalogos = useCallback(async () => {
    try {
      const [{ data: palmetas }, { data: eventos }] = await Promise.all([
        supabase.from("palmetas_led").select("id, codigo_visible, qr_uuid").order("codigo_visible"),
        supabase.from("eventos").select("id, nombre").order("nombre"),
      ]);

      if (palmetas && palmetas.length > 0) {
        setPalmetasDisponibles(palmetas as PalmetaOpcion[]);
        setNuevaPalmetaId(palmetas[0].id);
      }
      if (eventos && eventos.length > 0) {
        setEventosDisponibles(eventos as EventoOpcion[]);
        setNuevoEventoId(eventos[0].id);
      }
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchIncidencias();
    fetchCatalogos();

    // Suscripción en tiempo real a cambios en incidencias
    const channel = supabase
      .channel("incidencias-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidencias" },
        () => {
          fetchIncidencias();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIncidencias, fetchCatalogos, supabase]);

  /* ─── Resolver Incidencia en Supabase ─── */
  async function resolverIncidencia(id: string) {
    if (!solucionInput.trim()) return;

    setResolviendo(true);
    try {
      const { error } = await supabase
        .from("incidencias")
        .update({
          resuelto: true,
          solucion_tecnica: solucionInput.trim(),
        })
        .eq("id", id);

      if (error) {
        alert("Error al resolver la incidencia: " + error.message);
      } else {
        // Doble garantía: actualizar explícitamente el parque de palmetas
        if (incidenciaSeleccionada?.palmeta_id) {
          await supabase
            .from("palmetas_led")
            .update({
              estado: "operativo",
              ubicacion_actual: "bodega_central",
              ultima_revision: new Date().toISOString(),
            })
            .eq("id", incidenciaSeleccionada.palmeta_id);
        }

        setSuccessMsg("Incidencia resuelta exitosamente. Palmeta sincronizada a Operativa.");
        setTimeout(() => setSuccessMsg(""), 3500);
        await fetchIncidencias();
        setIncidenciaSeleccionada(null);
        setSolucionInput("");
      }
    } catch (err) {
      console.error("Error al resolver:", err);
    } finally {
      setResolviendo(false);
    }
  }

  /* ─── Crear Incidencia Real en Supabase ─── */
  async function handleCrearIncidencia(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaPalmetaId || !nuevoTipoFalla.trim()) return;

    setGuardandoNueva(true);
    try {
      const palmetaSeleccionada = palmetasDisponibles.find((p) => p.id === nuevaPalmetaId);
      const { data: authData } = await supabase.auth.getUser();

      const { error } = await supabase.from("incidencias").insert({
        palmeta_id: nuevaPalmetaId,
        qr_uuid: palmetaSeleccionada?.qr_uuid || "QR-MANUAL-" + Date.now(),
        evento_id: nuevoEventoId || null,
        tecnico_id: authData?.user?.id || null,
        tipo_falla: nuevoTipoFalla,
        descripcion: nuevaDescripcion.trim() || null,
        fecha_ocurrencia: new Date().toISOString(),
        resuelto: false,
      });

      if (error) {
        alert("Error al registrar incidencia: " + error.message);
      } else {
        // Doble garantía: sincronizar la palmeta a taller de inmediato
        await supabase
          .from("palmetas_led")
          .update({
            estado: "mantencion",
            ubicacion_actual: "taller",
          })
          .eq("id", nuevaPalmetaId);

        setSuccessMsg("Nueva incidencia registrada. Palmeta enviada a Taller.");
        setTimeout(() => setSuccessMsg(""), 3500);
        setModalCrearAbierto(false);
        setNuevaDescripcion("");
        await fetchIncidencias();
      }
    } catch (err) {
      console.error("Error al crear:", err);
    } finally {
      setGuardandoNueva(false);
    }
  }

  /* ─── Filtrado y Métricas ─── */
  const incidenciasFiltradas = incidencias.filter((item) => {
    const coincideFiltro =
      filtro === "todas" ? true : filtro === "pendientes" ? !item.resuelto : item.resuelto;

    const coincideBusqueda =
      item.codigo_palmeta.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.tipo_falla.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.evento_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.qr_uuid.toLowerCase().includes(busqueda.toLowerCase());

    return coincideFiltro && coincideBusqueda;
  });

  const total = incidencias.length;
  const pendientes = incidencias.filter((i) => !i.resuelto).length;
  const resueltas = incidencias.filter((i) => i.resuelto).length;

  return (
    <>
        {/* ── Resplandor Ambiental Sutil ── */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--pr-glow)] rounded-full blur-[150px]" />
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
              <span className="material-symbols-outlined text-base" style={{ color: "var(--er)" }}>
                warning
              </span>
              Módulo de Incidencias Técnicas
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => fetchIncidencias()}
              disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[var(--bd)] bg-[var(--sf2)] text-[var(--tx)] text-xs font-semibold hover:border-[var(--border-light)] active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Recargar incidencias"
            >
              <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setModalCrearAbierto(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--go)] text-[var(--gt)] text-xs font-bold active:scale-95 transition-all shadow-sm hover:brightness-105 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Nueva Incidencia</span>
            </button>
          </div>
        </header>

        {/* ── Notificación Flotante de Éxito ── */}
        {successMsg && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-['Outfit'] font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Contenido Principal ── */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1">
        {/* Banner de Título (Limpio y directo, sin botones duplicados) */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--er-badge-bg)] border border-[var(--er)]/30 text-[var(--er-text)] text-[11px] font-['Outfit'] font-semibold tracking-wider uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--er)]" />
            Base de Datos Supabase en Vivo
          </div>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--tx)]">
            Gestión de Incidencias Técnicas
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 max-w-2xl">
            Control en tiempo real de averías en terreno, trazabilidad de piezas y bitácora técnica de taller.
          </p>
        </div>

        {/* ── Métricas Rápidas (KPIs Semánticos) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card: Total */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[var(--bd)] card-shadow transition-shadow flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[var(--mu)] font-semibold">
                Total Registradas
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {total}
              </span>
              <span className="text-[11px] text-[#71717A] mt-0.5">En Supabase Cloud</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--kpi-total-icon-bg)] border border-[var(--kpi-total-icon-border)] text-[var(--kpi-total-icon-color)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">report</span>
            </div>
          </div>

          {/* Card: Pendientes (Rojo Atenuado Elegante) */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[var(--er)]/30 card-shadow transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-red-500/[0.05] dark:from-[#C24C44]/08 to-transparent pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[var(--er-text)] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--er)]" />
                Pendientes en Taller
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {pendientes}
              </span>
              <span className="text-[11px] text-[var(--mu)] mt-0.5">Requieren reparación técnica</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 dark:bg-[var(--er)]/12 dark:border-[var(--er)]/30 dark:text-[var(--er-text)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">build_circle</span>
            </div>
          </div>

          {/* Card: Resueltas (Verde Esmeralda) */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[#10B981]/30 card-shadow transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#10B981]/[0.05] dark:from-[#10B981]/10 to-transparent pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[#10B981] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Solucionadas / Operativas
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {resueltas}
              </span>
              <span className="text-[11px] text-[var(--mu)] mt-0.5">Listas para el próximo evento</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-[#10B981]/12 dark:border-[#10B981]/30 dark:text-[#10B981] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
          </div>
        </section>

        {/* ── Barra de Filtros y Búsqueda ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs de Filtro */}
          <div className="inline-flex p-1 rounded-xl bg-white dark:bg-[var(--sf)] border border-slate-200 dark:border-[var(--bd)] self-start card-shadow">
            <button
              type="button"
              onClick={() => setFiltro("todas")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                filtro === "todas"
                  ? "bg-[var(--go)] text-[var(--gt)] card-shadow transition-shadow shadow-[#D4AF37]/10"
                  : "text-[var(--mu)] hover:text-[var(--tx)]"
              }`}
            >
              Todas ({total})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("pendientes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtro === "pendientes"
                  ? "bg-[var(--er)] text-[var(--tx)] card-shadow transition-shadow shadow-[#C24C44]/20"
                  : "text-[var(--mu)] hover:text-[var(--tx)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--er)]" />
              Pendientes ({pendientes})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("resueltas")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtro === "resueltas"
                  ? "bg-[#10B981] text-[var(--tx)] card-shadow transition-shadow shadow-[#10B981]/20"
                  : "text-[var(--mu)] hover:text-[var(--tx)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Resueltas ({resueltas})
            </button>
          </div>

          {/* Buscador de Palmetas / Evento */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código (PL-AF69C8), evento o falla..."
              className="w-full h-10 pl-10 pr-4 bg-[var(--sf2)] border border-[var(--bd)] rounded-lg text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--pr)] focus:ring-1 focus:ring-[var(--pr)]/30 transition-all"
            />
          </div>
        </div>

        {/* ── Tabla Ejecutiva de Incidencias ── */}
        <div className="w-full rounded-2xl bg-white dark:bg-[var(--sf)] border border-slate-200 dark:border-[var(--bd)] card-shadow overflow-hidden">
          <div className="w-full overflow-x-auto pb-2">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[var(--bd)] bg-slate-50 dark:bg-[#16161a] text-slate-500 dark:text-[var(--mu)] font-['Outfit'] uppercase tracking-wider font-semibold text-xs">
                  <th className="py-3.5 px-4 sm:px-6">Palmeta / UUID</th>
                  <th className="py-3.5 px-4">Falla Reportada</th>
                  <th className="py-3.5 px-4">Evento de Origen</th>
                  <th className="py-3.5 px-4">Fecha &amp; Técnico</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[var(--mu)]">
                      <div className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg animate-spin text-[var(--pr)]">
                          progress_activity
                        </span>
                        <span>Cargando incidencias reales desde Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : incidenciasFiltradas.length > 0 ? (
                  incidenciasFiltradas.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[var(--sf2)]/50 transition-colors group"
                    >
                      {/* Palmeta / UUID */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="min-w-[64px] h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-[var(--sf2)] border border-slate-200 dark:border-[var(--bd)] flex items-center justify-center text-[var(--pr)] font-['Outfit'] font-bold text-xs tracking-wide shadow-inner shrink-0">
                            {item.codigo_palmeta}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-[var(--tx)] group-hover:text-[var(--pr)] transition-colors">
                              {item.codigo_palmeta}
                            </span>
                            <span className="font-mono text-[10px] text-[#71717A]">
                              {item.qr_uuid?.substring(0, 16)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Falla Reportada */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-[var(--tx)] text-xs">
                            {item.tipo_falla}
                          </span>
                          {item.descripcion && (
                            <span className="text-[11px] text-[#71717A] line-clamp-1 mt-0.5">
                              {item.descripcion}
                            </span>
                          )}
                          {item.foto_url && (
                            <span className="text-[10.5px] text-[var(--pr)] inline-flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-xs">image</span>
                              Foto adjunta
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Evento */}
                      <td className="py-4 px-4">
                        <span className="text-xs text-[var(--mu)] font-medium">
                          {item.evento_nombre}
                        </span>
                      </td>

                      {/* Fecha y Técnico */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-[var(--tx)]">
                            {new Date(item.fecha_ocurrencia).toLocaleString("es-CL", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-[10px] text-[#71717A]">
                            {item.tecnico_nombre}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        {item.resuelto ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] dark:bg-[#10B981]/15 dark:border-[#10B981]/30 dark:text-[#10B981] font-['Outfit'] font-semibold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#10B981]" />
                            Resuelto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] dark:bg-[var(--er)]/12 dark:border-[#C24C44]/30 dark:text-[#E59892] font-['Outfit'] font-semibold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] dark:bg-[var(--er)]" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setIncidenciaSeleccionada(item);
                            setSolucionInput(item.solucion_tecnica || "");
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            item.resuelto
                              ? "bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-[var(--sf2)] dark:border-[var(--bd)] dark:text-[var(--mu)] dark:hover:text-[var(--tx)]"
                              : "bg-[var(--go)] hover:bg-[#C5A059] text-[var(--gt)] card-shadow transition-shadow shadow-[#D4AF37]/10"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {item.resuelto ? "visibility" : "build"}
                          </span>
                          <span>{item.resuelto ? "Ver Bitácora" : "Gestionar"}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[#71717A]">
                      No se encontraron incidencias con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Modal de Detalle y Resolución Técnica ── */}
      {incidenciaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--sf)] border border-[var(--bd)] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-4">
              <div className="flex items-center gap-3">
                <div className="min-w-[64px] h-10 px-3 rounded-xl bg-[var(--go)]/10 border border-[var(--pr)]/30 flex items-center justify-center text-[var(--pr)] font-['Outfit'] font-bold text-sm tracking-wide shrink-0">
                  {incidenciaSeleccionada.codigo_palmeta}
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-semibold text-[var(--tx)]">
                    Detalle de Falla — {incidenciaSeleccionada.codigo_palmeta}
                  </h3>
                  <span className="text-[11px] text-[#71717A]">
                    UUID: {incidenciaSeleccionada.qr_uuid}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIncidenciaSeleccionada(null)}
                className="w-8 h-8 rounded-lg bg-[var(--sf2)] hover:bg-[var(--sf2)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Ficha Resumen */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--sf2)]/60 p-4 rounded-xl border border-[var(--bd)]">
              <div>
                <span className="text-[#71717A] block">Tipo de Falla:</span>
                <span className="font-semibold text-[var(--tx)] mt-0.5 block">
                  {incidenciaSeleccionada.tipo_falla}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Evento de Ocurrencia:</span>
                <span className="font-medium text-[var(--pr)] mt-0.5 block">
                  {incidenciaSeleccionada.evento_nombre}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Técnico que reportó:</span>
                <span className="text-[var(--tx)] mt-0.5 block">
                  {incidenciaSeleccionada.tecnico_nombre}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] block">Fecha de Ocurrencia:</span>
                <span className="text-[var(--tx)] mt-0.5 block">
                  {new Date(incidenciaSeleccionada.fecha_ocurrencia).toLocaleString("es-CL")}
                </span>
              </div>
            </div>

            {/* Descripción detallada si existe */}
            {incidenciaSeleccionada.descripcion && (
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-[#71717A]">Observaciones en Terreno:</span>
                <p className="text-[var(--tx)] bg-[var(--sf2)]/40 p-3 rounded-xl border border-[var(--bd)]/70">
                  {incidenciaSeleccionada.descripcion}
                </p>
              </div>
            )}

            {/* Evidencia Fotográfica (si existe) */}
            {incidenciaSeleccionada.foto_url && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Evidencia Capturada en Terreno
                </span>
                <div className="w-full h-44 rounded-xl overflow-hidden border border-[var(--bd)] relative bg-[var(--sf2)]">
                  <img
                    src={incidenciaSeleccionada.foto_url}
                    alt="Evidencia técnica"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] text-[var(--tx)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[var(--pr)]">
                      photo_camera
                    </span>
                    Captura in situ
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de Cierre de Falla / Solución Técnica */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="solucion-textarea"
                className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']"
              >
                {incidenciaSeleccionada.resuelto
                  ? "Bitácora de Reparación Aplicada:"
                  : "Registrar Solución Técnica de Taller:"}
              </label>

              {incidenciaSeleccionada.resuelto ? (
                <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs text-[var(--tx)] leading-relaxed">
                  {incidenciaSeleccionada.solucion_tecnica || "Sin notas técnicas registradas."}
                </div>
              ) : (
                <textarea
                  id="solucion-textarea"
                  rows={3}
                  value={solucionInput}
                  onChange={(e) => setSolucionInput(e.target.value)}
                  placeholder="Ej: Módulo LED cambiado por repuesto SKU MOD-LED-01. Soldadura de conector y prueba de 2 horas sin fallas."
                  className="w-full p-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--pr)] focus:ring-1 focus:ring-[var(--pr)]/30 transition-all resize-none"
                />
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--bd)]">
              <button
                type="button"
                onClick={() => setIncidenciaSeleccionada(null)}
                className="px-4 py-2 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf2)] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[var(--mu)] hover:text-[var(--tx)] transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              {!incidenciaSeleccionada.resuelto && (
                <button
                  type="button"
                  disabled={!solucionInput.trim() || resolviendo}
                  onClick={() => resolverIncidencia(incidenciaSeleccionada.id)}
                  className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all shadow-lg shadow-[#10B981]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-base ${resolviendo ? "animate-spin" : ""}`}>
                    {resolviendo ? "progress_activity" : "check_circle"}
                  </span>
                  <span>{resolviendo ? "Guardando en Supabase..." : "Marcar como Resuelta"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nueva Incidencia (Pruebas & Registro Manual) ── */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--sf)] border border-[var(--bd)] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--go)]/15 border border-[var(--pr)]/30 flex items-center justify-center text-[var(--pr)]">
                  <span className="material-symbols-outlined text-xl">report_problem</span>
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-semibold text-[var(--tx)]">
                    Reportar Incidencia
                  </h3>
                  <span className="text-[11px] text-[var(--mu)]">
                    Registro directo en Supabase Cloud
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className="w-8 h-8 rounded-lg bg-[var(--sf2)] hover:bg-[var(--sf2)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearIncidencia} className="flex flex-col gap-4">
              {/* Selector Palmeta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Palmeta LED Afectada
                </label>
                <select
                  value={nuevaPalmetaId}
                  onChange={(e) => setNuevaPalmetaId(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                  required
                >
                  {palmetasDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo_visible} ({p.qr_uuid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector Evento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Evento de Ocurrencia
                </label>
                <select
                  value={nuevoEventoId}
                  onChange={(e) => setNuevoEventoId(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                >
                  <option value="">(Sin evento específico)</option>
                  {eventosDisponibles.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Falla */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Tipo de Falla Técnica
                </label>
                <select
                  value={nuevoTipoFalla}
                  onChange={(e) => setNuevoTipoFalla(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                  required
                >
                  <option value="Módulo LED Quemado">Módulo LED Quemado (Píxeles muertos / apagado)</option>
                  <option value="Conector PowerCON Dañado">Conector PowerCON Dañado / Traba rota</option>
                  <option value="Pérdida de Señal EtherCON">Pérdida de Señal EtherCON (Recepción intermitente)</option>
                  <option value="Fisura en Acrílico Superior">Fisura en Acrílico Superior (Impacto / pisada)</option>
                  <option value="Fuente de Poder Sobrecalentada">Fuente de Poder Sobrecalentada</option>
                  <option value="Escaneo Operativo Terreno">Escaneo Operativo Terreno</option>
                </select>
              </div>

              {/* Descripción / Observaciones */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Observaciones Técnicas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Detalles observados en terreno o motivo del reporte..."
                  className="w-full p-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-all resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--bd)]">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf2)] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[var(--mu)] hover:text-[var(--tx)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNueva}
                  className="px-4 py-2 rounded-xl bg-[var(--go)] hover:bg-[#C5A059] text-[var(--gt)] font-['Outfit'] font-semibold text-xs tracking-wider uppercase transition-all card-shadow transition-shadow shadow-[#D4AF37]/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${guardandoNueva ? "animate-spin" : ""}`}>
                    {guardandoNueva ? "progress_activity" : "add_task"}
                  </span>
                  <span>{guardandoNueva ? "Guardando..." : "Guardar Incidencia"}</span>
                </button>
              </div>
            </form>
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
            Módulo de Incidencias v2.0 (Supabase Real-Time)
          </span>
        </div>
      </footer>
    </>
  );
}
