"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";


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

/* ─── Date Formatter Helpers ─── */
function formatEventDate(iso: string | null) {
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
}

function formatTimeAgo(iso: string) {
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
  const [eventos, setEventos] = useState(initialEventos);
  const [palmetas, setPalmetas] = useState(initialPalmetas);
  const [incidencias, setIncidencias] = useState(initialIncidencias);
  const [modalNuevoEvento, setModalNuevoEvento] = useState(false);
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const [lastClearedTimestamp, setLastClearedTimestamp] = useState<string | null>(null);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>([]);

  // Cargar notificaciones limpiadas persistentes de localStorage
  useEffect(() => {
    try {
      const savedTime = localStorage.getItem("aleprod_notifications_cleared_at");
      if (savedTime) {
        setLastClearedTimestamp(savedTime);
      }
      const saved = localStorage.getItem("aleprod_cleared_notifications");
      if (saved) {
        setClearedNotificationIds(JSON.parse(saved));
      }
    } catch {
      // Ignorar errores en navegadores restrictivos
    }
  }, []);

  const saveClearedIds = (ids: string[]) => {
    setClearedNotificationIds(ids);
    try {
      localStorage.setItem("aleprod_cleared_notifications", JSON.stringify(ids));
    } catch {
      // Ignorar
    }
  };

  const isIncidenciaCleared = (inc: { id: string; created_at?: string; fecha_ocurrencia?: string }) => {
    // Si fue descartada individualmente
    if (clearedNotificationIds.includes("inc-" + inc.id)) return true;

    // Si fue creada antes o en el momento en que el usuario pulsó Limpiar
    if (lastClearedTimestamp) {
      const incTime = new Date(inc.created_at || inc.fecha_ocurrencia || 0).getTime();
      const clearedTime = new Date(lastClearedTimestamp).getTime();
      if (!isNaN(incTime) && !isNaN(clearedTime) && incTime <= clearedTime) {
        return true;
      }
    }

    return false;
  };
  const [toastIncidencia, setToastIncidencia] = useState<{
    id: string;
    tipo_falla: string;
    codigo_palmeta?: string;
    created_at?: string;
  } | null>(null);

  useEffect(() => {
    if (!toastIncidencia) return;
    const timer = setTimeout(() => {
      setToastIncidencia(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [toastIncidencia]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "incidencias" }, async (payload) => {
        const { data } = await supabase.from("incidencias").select("id, palmeta_id, qr_uuid, tipo_falla, resuelto, created_at, fecha_ocurrencia").order("fecha_ocurrencia", { ascending: false });
        if (data) setIncidencias(data);

        // Si es una nueva incidencia reportada desde terreno
        if (payload.eventType === "INSERT" && payload.new) {
          const newInc = payload.new as { id: string; tipo_falla?: string; qr_uuid?: string; created_at?: string };
          setToastIncidencia({
            id: newInc.id,
            tipo_falla: newInc.tipo_falla || "Falla reportada en terreno",
            codigo_palmeta: newInc.qr_uuid?.slice(0, 8),
            created_at: newInc.created_at,
          });

          // Asegurar que esta nueva incidencia aparezca de inmediato y no esté silenciada (en memoria y localStorage)
          setClearedNotificationIds((prev) => {
            const filtered = prev.filter((id) => id !== ("inc-" + newInc.id));
            try {
              localStorage.setItem("aleprod_cleared_notifications", JSON.stringify(filtered));
            } catch {
              // Ignorar
            }
            return filtered;
          });
        }
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

  const listaNotificaciones = useMemo(() => {
    const items: Array<{
      id: string;
      tipo: "incidencia" | "repuesto" | "evento" | "sistema";
      titulo: string;
      descripcion: string;
      tiempo: string;
      badge: string;
      link: string;
      severidad: "danger" | "warning" | "info" | "success";
    }> = [];

    // 1. Incidencias pendientes que NO hayan sido limpiadas previamente
    const pendientes = incidencias.filter((i) => !i.resuelto && !isIncidenciaCleared(i));
    pendientes.slice(0, 8).forEach((inc) => {
      items.push({
        id: "inc-" + inc.id,
        tipo: "incidencia",
        titulo: "Avería: " + inc.tipo_falla,
        descripcion: "Palmeta " + (inc.codigo_palmeta || inc.qr_uuid?.slice(0, 8) || "S/C") + " reportada por terreno",
        tiempo: formatTimeAgo(inc.fecha_ocurrencia || inc.created_at),
        badge: "Avería Activa",
        link: "/incidencias",
        severidad: "danger",
      });
    });

    // 2. Repuestos críticos
    const repuestosCriticos = initialRepuestos.filter((r) => r.stock_actual <= r.stock_minimo);
    if (repuestosCriticos.length > 0) {
      items.push({
        id: "rep-alerta",
        tipo: "repuesto",
        titulo: "Alerta de Stock Crítico",
        descripcion: repuestosCriticos.length + " repuesto(s) alcanzaron o están bajo el stock mínimo.",
        tiempo: "Atención",
        badge: "Inventario",
        link: "/",
        severidad: "warning",
      });
    }

    // 3. Evento en curso activo
    if (eventoActivo && eventoActivo.estado === "en_curso") {
      items.push({
        id: "ev-" + eventoActivo.id,
        tipo: "evento",
        titulo: "Montaje Activo: " + eventoActivo.nombre,
        descripcion: (eventoActivo.locacion || "Locación por definir") + " (" + (eventoActivo.metros_cuadrados || 0) + " m²)",
        tiempo: formatTimeAgo(eventoActivo.fecha_inicio || new Date().toISOString()),
        badge: "En Terreno",
        link: "/eventos",
        severidad: "info",
      });
    }

    // 4. Sincronización en vivo
    items.push({
      id: "sync-status",
      tipo: "sistema",
      titulo: "Sistemas en tiempo real",
      descripcion: "Sincronización activa con Supabase Cloud y terreno.",
      tiempo: "En línea",
      badge: "Sincronizado",
      link: "/",
      severidad: "success",
    });

    return items;
  }, [incidencias, initialRepuestos, eventoActivo]);

  const notificacionesVisibles = useMemo(() => {
    return listaNotificaciones.filter((n) => !clearedNotificationIds.includes(n.id));
  }, [listaNotificaciones, clearedNotificationIds]);

  const handleLimpiarNotificaciones = () => {
    const nowIso = new Date().toISOString();
    setLastClearedTimestamp(nowIso);
    try {
      localStorage.setItem("aleprod_notifications_cleared_at", nowIso);
    } catch {
      // Ignorar
    }

    // También descartar alertas fijas actuales (repuestos, eventos, etc.)
    const currentAlertIds = listaNotificaciones.map((n) => n.id);
    const updated = Array.from(new Set([...clearedNotificationIds, ...currentAlertIds]));
    saveClearedIds(updated);
  };

  const handleDescartarNotificacion = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = Array.from(new Set([...clearedNotificationIds, id]));
    saveClearedIds(updated);
  };

  /* ─── Filter Events ─── */
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      if (filter === "all") return true;
      if (filter === "en_curso") return ev.estado === "en_curso";
      return ev.estado === "finalizado";
    });
  }, [eventos, filter]);

  const countAll = eventos.length;
  const countEnCurso = eventos.filter((e) => e.estado === "en_curso").length;
  const countFinalizados = eventos.filter((e) => e.estado === "finalizado").length;



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
          {/* Section Indicator */}
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base" style={{ color: "var(--pr)" }}>
              dashboard
            </span>
            <span className="text-sm font-bold text-[var(--tx)]">
              Panel de Control Central
            </span>
          </div>

          <div style={{ flex: "1 1 0" }}></div>




          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifContainerRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificaciones"
              aria-expanded={showNotifications}
              className={`relative w-11 h-11 rounded-xl border border-[var(--bd)] bg-[var(--sf2)] text-[var(--tx)] flex items-center justify-center cursor-pointer transition-all hover:border-[var(--pr)] hover:text-[var(--pr)] active:scale-95 shadow-sm ${
                showNotifications ? "border-[var(--pr)] text-[var(--pr)] ring-2 ring-[var(--pr)]/20" : ""
              }`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"></path>
              </svg>
              {notificacionesVisibles.length > 0 && (
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

            {/* Panel Flotante de Notificaciones */}
            {showNotifications && (
              <div
                className="absolute right-0 top-full mt-2 w-[380px] sm:w-[420px] max-w-[calc(100vw-32px)] bg-[var(--sf)] border border-[var(--bd)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 card-shadow"
                role="region"
                aria-label="Bandeja de notificaciones"
              >
                {/* Header del Panel */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--bd)] bg-[var(--sf2)]/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--go)]/15 border border-[var(--pr)]/30 flex items-center justify-center text-[var(--pr)]">
                      <span className="material-symbols-outlined text-lg">notifications</span>
                    </div>
                    <div>
                      <h4 className="font-['Outfit'] text-sm font-bold text-[var(--tx)] leading-none">
                        Notificaciones
                      </h4>
                      <p className="text-[11px] text-[var(--mu)] mt-0.5">
                        {notificacionesVisibles.length > 0
                          ? `${notificacionesVisibles.length} alerta(s) disponible(s)`
                          : "Todo al día"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {notificacionesVisibles.length > 0 && (
                      <button
                        type="button"
                        onClick={handleLimpiarNotificaciones}
                        title="Limpiar todas las notificaciones"
                        className="text-[11px] font-semibold text-[var(--mu)] hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1 rounded-lg border border-[var(--bd)] hover:border-red-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">delete_sweep</span>
                        <span>Limpiar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      aria-label="Cerrar notificaciones"
                      className="w-7 h-7 rounded-lg border border-[var(--bd)] bg-[var(--sf)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Notificaciones */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--bd)] overscroll-contain">
                  {notificacionesVisibles.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">task_alt</span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--tx)] mt-1">Sin alertas pendientes</p>
                      <p className="text-[11px] text-[var(--mu)] max-w-[240px] leading-relaxed">
                        Has limpiado las notificaciones. Cada vez que se reporte una nueva incidencia desde terreno, aparecerá aquí automáticamente.
                      </p>
                    </div>
                  ) : (
                    notificacionesVisibles.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 p-3.5 hover:bg-[var(--sf2)] transition-colors text-inherit no-underline group relative"
                      >
                        {/* Icono de severidad */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                            n.severidad === "danger"
                              ? "bg-red-500/10 border-red-500/25 text-red-500"
                              : n.severidad === "warning"
                              ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
                              : n.severidad === "info"
                              ? "bg-[var(--go)]/15 border-[var(--pr)]/30 text-[var(--pr)]"
                              : "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {n.severidad === "danger"
                              ? "warning"
                              : n.severidad === "warning"
                              ? "build"
                              : n.severidad === "info"
                              ? "theater_comedy"
                              : "cloud_done"}
                          </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[var(--tx)] truncate">
                              {n.titulo}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-[var(--mu)] font-medium">
                                {n.tiempo}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDescartarNotificacion(n.id, e)}
                                title="Descartar esta alerta"
                                className="w-5 h-5 rounded flex items-center justify-center text-[var(--mu)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">close</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[var(--mu)] mt-0.5 leading-relaxed line-clamp-2">
                            {n.descripcion}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                                n.severidad === "danger"
                                  ? "bg-red-500/15 text-red-400"
                                  : n.severidad === "warning"
                                  ? "bg-amber-500/15 text-amber-400"
                                  : n.severidad === "info"
                                  ? "bg-[var(--prs)] text-[var(--pr)]"
                                  : "bg-emerald-500/15 text-emerald-400"
                              }`}
                            >
                              {n.badge}
                            </span>
                            <Link
                              href={n.link}
                              onClick={() => setShowNotifications(false)}
                              className="text-[10.5px] text-[var(--pr)] font-semibold flex items-center gap-0.5 hover:underline"
                            >
                              Revisar <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer del Panel */}
                <div className="p-3 bg-[var(--sf2)]/40 border-t border-[var(--bd)] flex items-center justify-between">
                  <span className="text-[11px] text-[var(--mu)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Live Feed
                  </span>
                  <Link
                    href="/incidencias"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-[var(--pr)] hover:underline flex items-center gap-1"
                  >
                    Centro de Averías →
                  </Link>
                </div>
              </div>
            )}
          </div>

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
