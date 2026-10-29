"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Interfaces ─── */
interface Evento {
  id: string;
  nombre: string;
  locacion: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  estado: "planificado" | "en_curso" | "finalizado";
  metros_cuadrados: number | null;
  tipo_pantalla: string | null;
  created_at: string;
}

type FiltroEstado = "todas" | "en_curso" | "planificado" | "finalizado";

export default function EventosPage() {
  const supabase = createClient();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroEstado>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  /* ─── Formulario ─── */
  const [nombre, setNombre] = useState("");
  const [locacion, setLocacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [metrosCuadrados, setMetrosCuadrados] = useState("80");
  const [tipoPantalla, setTipoPantalla] = useState("Pantalla Escenario P3.9 Outdoor");
  const [estadoInicial, setEstadoInicial] = useState<"planificado" | "en_curso">("planificado");

  /* ─── Fetch Eventos ─── */
  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .order("fecha_inicio", { ascending: false });

      if (error) {
        console.error("Error al cargar eventos:", error);
      } else if (data) {
        setEventos(data as Evento[]);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  /* ─── Cambiar Estado de un Evento ─── */
  const handleCambiarEstado = async (eventoId: string, nuevoEstado: Evento["estado"]) => {
    setActualizandoId(eventoId);
    try {
      const updateData: any = { estado: nuevoEstado };
      if (nuevoEstado === "finalizado") {
        updateData.fecha_termino = new Date().toISOString();
      }

      const { error } = await supabase
        .from("eventos")
        .update(updateData)
        .eq("id", eventoId);

      if (error) {
        alert("Error al actualizar evento: " + error.message);
      } else {
        setToastMsg(`Estado cambiado a "${nuevoEstado.replace("_", " ").toUpperCase()}"`);
        setTimeout(() => setToastMsg(""), 3500);
        await fetchEventos();
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setActualizandoId(null);
    }
  };

  /* ─── Guardar Nuevo Evento ─── */
  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !locacion.trim() || !fechaInicio) return;

    setGuardando(true);
    try {
      const { data: authData } = await supabase.auth.getUser();

      const { error } = await supabase.from("eventos").insert({
        nombre: nombre.trim(),
        locacion: locacion.trim(),
        fecha_inicio: new Date(fechaInicio).toISOString(),
        fecha_termino: fechaTermino ? new Date(fechaTermino).toISOString() : null,
        estado: estadoInicial,
        metros_cuadrados: parseFloat(metrosCuadrados) || 0,
        tipo_pantalla: tipoPantalla,
        tecnico_id: authData?.user?.id || null,
      });

      if (error) {
        alert("Error al registrar evento: " + error.message);
      } else {
        setToastMsg("¡Evento registrado exitosamente en Supabase!");
        setTimeout(() => setToastMsg(""), 3500);
        setModalAbierto(false);
        setNombre("");
        setLocacion("");
        setFechaInicio("");
        setFechaTermino("");
        setMetrosCuadrados("80");
        await fetchEventos();
      }
    } catch (err) {
      console.error("Error al registrar:", err);
    } finally {
      setGuardando(false);
    }
  };

  /* ─── Métricas y Filtros ─── */
  const totalEventos = eventos.length;
  const enCurso = eventos.filter((e) => e.estado === "en_curso").length;
  const planificados = eventos.filter((e) => e.estado === "planificado").length;
  const finalizados = eventos.filter((e) => e.estado === "finalizado").length;

  const eventosFiltrados = eventos.filter((ev) => {
    const coincideFiltro =
      filtro === "todas" ? true : ev.estado === filtro;

    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      !q ||
      ev.nombre.toLowerCase().includes(q) ||
      ev.locacion.toLowerCase().includes(q) ||
      (ev.tipo_pantalla || "").toLowerCase().includes(q);

    return coincideFiltro && coincideBusqueda;
  });

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
              <span className="material-symbols-outlined text-base" style={{ color: "var(--pr)" }}>
                calendar_month
              </span>
              Gestión de Eventos y Producciones
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => fetchEventos()}
              disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[var(--bd)] bg-[var(--sf2)] text-[var(--tx)] text-xs font-semibold hover:border-[var(--border-light)] active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Recargar eventos"
            >
              <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--go)] text-[var(--gt)] text-xs font-bold active:scale-95 transition-all shadow-sm hover:brightness-105 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Nuevo Evento</span>
            </button>
          </div>
        </header>

        {/* ── Toast de Confirmación ── */}
        {toastMsg && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-['Outfit'] font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ── Contenido Principal ── */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1">
        {/* Banner de Título (Limpio y directo, sin botones duplicados) */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--prs)] border border-[var(--pr)]/25 text-[var(--pr)] text-[11px] font-['Outfit'] font-semibold tracking-wider uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Planificación y Montaje Operativo
          </div>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--tx)]">
            Producciones y Eventos
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 max-w-2xl">
            Administración de fechas, recintos, metraje de pantalla y estado de activación para técnicos en terreno.
          </p>
        </div>

        {/* ── KPIs Ejecutivos ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[var(--bd)] card-shadow transition-shadow flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[var(--mu)] font-semibold">
                Total Registrados
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {totalEventos}
              </span>
              <span className="text-[11px] text-[#71717A] mt-0.5">Producciones anuales</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--kpi-total-icon-bg)] border border-[var(--kpi-total-icon-border)] text-[var(--kpi-total-icon-color)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">stadium</span>
            </div>
          </div>

          {/* En Curso */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[#10B981]/30 card-shadow transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#10B981]/[0.05] dark:from-[#10B981]/10 to-transparent pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[#10B981] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                En Curso
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {enCurso}
              </span>
              <span className="text-[11px] text-[#10B981]/80 mt-0.5">Activos en terreno</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--ok-badge-bg)] border border-[var(--ok)]/30 text-[var(--ok-text)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">play_circle</span>
            </div>
          </div>

          {/* Planificados */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[var(--pr)]/30 card-shadow transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-blue-500/[0.05] dark:from-[#D4AF37]/[0.08] to-transparent pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[var(--pr)] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--go)]" />
                Planificados
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {planificados}
              </span>
              <span className="text-[11px] text-[var(--pr)]/80 mt-0.5">Próximas fechas</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--kpi-total-icon-bg)] border border-[var(--kpi-total-icon-border)] text-[var(--kpi-total-icon-color)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">event_upcoming</span>
            </div>
          </div>

          {/* Finalizados */}
          <div className="p-5 rounded-xl bg-[var(--sf)] border border-[var(--bd)] card-shadow transition-shadow flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-['Outfit'] tracking-wider text-[#71717A] font-semibold">
                Finalizados
              </span>
              <span className="text-3xl font-bold font-['Outfit'] text-[var(--tx)] mt-1">
                {finalizados}
              </span>
              <span className="text-[11px] text-[#71717A] mt-0.5">Historial cerrado</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--kpi-done-icon-bg)] border border-[var(--kpi-done-icon-border)] text-[var(--kpi-done-icon-color)] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">task_alt</span>
            </div>
          </div>
        </section>

        {/* ── Filtros y Buscador ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="inline-flex p-1 rounded-xl bg-[var(--sf)] border border-[var(--bd)] self-start overflow-x-auto">
            <button
              type="button"
              onClick={() => setFiltro("todas")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                filtro === "todas"
                  ? "bg-[var(--go)] text-[var(--gt)] card-shadow transition-shadow"
                  : "text-[var(--mu)] hover:text-[var(--tx)]"
              }`}
            >
              Todos ({totalEventos})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("en_curso")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtro === "en_curso"
                  ? "bg-[#10B981] text-[var(--tx)] card-shadow transition-shadow"
                  : "text-[var(--mu)] hover:text-[var(--tx)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              En Curso ({enCurso})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("planificado")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtro === "planificado"
                  ? "bg-[#78580a] text-[var(--tx)] border border-[#D4AF37]/40 card-shadow transition-shadow"
                  : "text-[var(--mu)] hover:text-[var(--tx)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--go)]" />
              Planificados ({planificados})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("finalizado")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                filtro === "finalizado"
                  ? "bg-slate-200 text-slate-800 dark:bg-[#27272A] dark:text-[var(--tx)]"
                  : "text-slate-500 dark:text-[#71717A] hover:text-[var(--tx)]"
              }`}
            >
              Finalizados ({finalizados})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar evento por nombre, locación o pantalla..."
              className="w-full h-10 pl-10 pr-4 bg-[var(--sf2)] border border-[var(--bd)] rounded-lg text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-all"
            />
          </div>
        </div>

        {/* ── Tabla de Eventos ── */}
        <div className="w-full rounded-2xl bg-white dark:bg-[var(--sf)] border border-slate-200 dark:border-[var(--bd)] card-shadow overflow-hidden">
          <div className="w-full overflow-x-auto pb-2">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[var(--bd)] bg-slate-50 dark:bg-[#16161a] text-slate-500 dark:text-[var(--mu)] font-['Outfit'] uppercase tracking-wider font-semibold text-xs">
                  <th className="py-3.5 px-4 sm:px-6">Producción / Locación</th>
                  <th className="py-3.5 px-4">Configuración Técnica</th>
                  <th className="py-3.5 px-4">Metraje</th>
                  <th className="py-3.5 px-4">Fechas</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Gestión</th>
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
                        <span>Cargando eventos desde Supabase Cloud...</span>
                      </div>
                    </td>
                  </tr>
                ) : eventosFiltrados.length > 0 ? (
                  eventosFiltrados.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 dark:hover:bg-[var(--sf2)]/50 transition-colors group">
                      {/* Nombre y Locación */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                              ev.estado === "en_curso"
                                ? "bg-[#10B981] animate-pulse"
                                : ev.estado === "planificado"
                                ? "bg-[var(--go)]"
                                : "bg-[#71717A]"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-[var(--tx)] group-hover:text-[var(--pr)] transition-colors">
                              {ev.nombre}
                            </span>
                            <span className="text-xs text-[var(--mu)] flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-xs text-[#71717A]">
                                location_on
                              </span>
                              {ev.locacion}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo de Pantalla */}
                      <td className="py-4 px-4">
                        <span className="text-xs text-[var(--tx)]">
                          {ev.tipo_pantalla || "No especificada"}
                        </span>
                      </td>

                      {/* Metraje */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-[var(--sf2)] border border-[var(--bd)] text-xs font-mono font-bold text-[var(--pr)]">
                          {ev.metros_cuadrados || 0} m²
                        </span>
                      </td>

                      {/* Fechas */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-[var(--tx)]">
                            {new Date(ev.fecha_inicio).toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-[#71717A]">
                            {ev.fecha_termino
                              ? `Termina: ${new Date(ev.fecha_termino).toLocaleDateString("es-CL", {
                                  day: "2-digit",
                                  month: "short",
                                })}`
                              : "En desarrollo"}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        {ev.estado === "en_curso" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] dark:bg-[#10B981]/15 dark:border-[#10B981]/30 dark:text-[#10B981] font-['Outfit'] font-semibold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#10B981] animate-pulse" />
                            En Curso
                          </span>
                        ) : ev.estado === "planificado" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#1D4ED8] dark:bg-[#D4AF37]/15 dark:border-[#D4AF37]/30 dark:text-[#D4AF37] font-['Outfit'] font-semibold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#D4AF37]" />
                            Planificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 dark:bg-[#27272A] dark:border-transparent dark:text-[#71717A] font-['Outfit'] font-semibold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-[#71717A]" />
                            Finalizado
                          </span>
                        )}
                      </td>

                      {/* Selector de Estado Rápido */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <select
                          value={ev.estado}
                          disabled={actualizandoId === ev.id}
                          onChange={(e) =>
                            handleCambiarEstado(ev.id, e.target.value as Evento["estado"])
                          }
                          className="px-2.5 py-1.5 rounded-lg text-[16px] md:text-xs font-['Outfit'] uppercase tracking-wider font-semibold bg-white border border-slate-200 text-slate-900 shadow-sm hover:bg-slate-50 dark:bg-[var(--sf2)] dark:border-[var(--bd)] dark:text-[var(--tx)] dark:shadow-none dark:hover:border-[#D4AF37] cursor-pointer transition-all focus:outline-none"
                        >
                          <option value="en_curso">● En Curso</option>
                          <option value="planificado">● Planificado</option>
                          <option value="finalizado">● Finalizado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[#71717A]">
                      No se encontraron eventos con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Modal Nueva Producción ── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--sf)] border border-[var(--bd)] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--go)]/15 border border-[var(--pr)]/30 flex items-center justify-center text-[var(--pr)]">
                  <span className="material-symbols-outlined text-xl">event_available</span>
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-semibold text-[var(--tx)]">
                    Registrar Nueva Producción
                  </h3>
                  <span className="text-[11px] text-[#71717A]">
                    Planificación y montaje en Supabase Cloud
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 rounded-lg bg-[var(--sf2)] hover:bg-[var(--sf2)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearEvento} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Nombre del Evento / Producción
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Lollapalooza 2026 · Escenario Perry's"
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Locación / Recinto
                </label>
                <input
                  type="text"
                  required
                  value={locacion}
                  onChange={(e) => setLocacion(e.target.value)}
                  placeholder="Ej: Parque Bicentenario de Cerrillos, Santiago"
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                    Fecha y Hora de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                    Fecha de Término (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaTermino}
                    onChange={(e) => setFechaTermino(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                    Metros Cuadrados (m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={metrosCuadrados}
                    onChange={(e) => setMetrosCuadrados(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                    Estado Inicial
                  </label>
                  <select
                    value={estadoInicial}
                    onChange={(e) =>
                      setEstadoInicial(e.target.value as "planificado" | "en_curso")
                    }
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                  >
                    <option value="planificado">● Planificado (Próximo)</option>
                    <option value="en_curso">● En Curso (Activar Ahora)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Configuración Técnica
                </label>
                <select
                  value={tipoPantalla}
                  onChange={(e) => setTipoPantalla(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all"
                >
                  <option value="Pantalla Escenario P3.9 Outdoor">
                    Pantalla Escenario P3.9 Outdoor (Alta Luminosidad)
                  </option>
                  <option value="Pantalla P2.9 Indoor">
                    Pantalla P2.9 Indoor (Alta Definición)
                  </option>
                  <option value="Pista de Baile LED Interactiva">
                    Pista de Baile LED Interactiva (Vidrio Templado)
                  </option>
                  <option value="Tótem LED Publicitario">
                    Tótem LED Publicitario / Vertical
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--bd)]">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf2)] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[var(--mu)] hover:text-[var(--tx)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-[var(--go)] hover:bg-[#C5A059] text-[var(--gt)] font-['Outfit'] font-semibold text-xs tracking-wider uppercase transition-all card-shadow transition-shadow shadow-[#D4AF37]/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${guardando ? "animate-spin" : ""}`}>
                    {guardando ? "progress_activity" : "event_available"}
                  </span>
                  <span>{guardando ? "Guardando..." : "Guardar Producción"}</span>
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
            Módulo de Producciones v1.0
          </span>
        </div>
      </footer>
    </>
  );
}
