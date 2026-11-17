"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Interfaces ─── */
export interface CentroEvento {
  id: string;
  nombre: string;
}

export const CENTROS_EVENTOS_FALLBACK: CentroEvento[] = [
  { id: "eb8a6ee9-8afb-4eea-b817-05afab6005d7", nombre: "Alto Pomaire" },
  { id: "f260b80b-91d5-45c4-9f8f-3bf17296f592", nombre: "Alto San Francisco" },
  { id: "66d1c529-0246-4d36-884e-3a0177c774cb", nombre: "Best Western Premier Marina" },
  { id: "cadeb35b-af17-4875-afe4-1b08bda045a2", nombre: "Casa Barros" },
  { id: "3a497f97-0849-4851-a3b5-965880d7cd7e", nombre: "Casona El Rosario" },
  { id: "12d55cdc-9e3c-461a-a82c-949b6aa2f60b", nombre: "Casona La Laguna" },
  { id: "d1790bf4-f1bb-4df1-8976-ea9adf07a81e", nombre: "Casona Macul" },
  { id: "e4d31758-3cff-43ae-bb80-0376101070d6", nombre: "Catamapu" },
  { id: "0620be55-d0f6-498d-a054-5bbcb5c4e66c", nombre: "Cenco Florida" },
  { id: "694c6cae-06d9-4c56-af6b-41992c4c6a09", nombre: "Centro La Reina" },
  { id: "c677edc0-b507-40d8-a409-6c07f14e3aba", nombre: "CentroParque" },
  { id: "ebb6f306-b0a0-4533-83c7-548139b9fdbb", nombre: "Club Golf" },
  { id: "304baee2-076c-42d2-a128-d8c469d0a875", nombre: "Club Hípico" },
  { id: "464ea1ee-3579-4019-98d5-0eebc3551300", nombre: "Club Manquehue" },
  { id: "dc893ba7-01cd-47ee-bd15-1b13378befe9", nombre: "Club Militar" },
  { id: "34cadde6-831b-48e5-a134-c8436044de82", nombre: "Club Providencia" },
  { id: "2a8cf718-4889-4879-83f5-a1d0044a57db", nombre: "Country Club Marbella" },
  { id: "65e5b6a1-2554-454a-997a-09c4c8d92fce", nombre: "Entremuros" },
  { id: "b5348ed0-16e7-417c-afca-3b8e1b09649f", nombre: "Espacio Fogon" },
  { id: "2c21bc78-bf57-44f4-8bbf-895ad0575f0c", nombre: "Espacio Nehuen" },
  { id: "c6c99377-4f67-4d33-9af4-1f4d3fcaa5c9", nombre: "Estadio Israelita" },
  { id: "5cd6a7d9-58f8-4c1d-b808-c97e51e30f73", nombre: "GH" },
  { id: "0dd6aa5a-8fce-418e-9a0c-67b34f8e04e2", nombre: "Hilaria" },
  { id: "3f24a92e-ab3b-4fa2-9c35-e04695188aa8", nombre: "Hotel AlmaCruz" },
  { id: "19e037db-d09a-4bcd-98a8-64e9e69b10ef", nombre: "Hotel Casa Maire" },
  { id: "168af36f-3314-4bf0-9572-d2ca6a87ba71", nombre: "Hotel Marriot" },
  { id: "383183b8-e108-47c9-8745-07023c24e0d8", nombre: "Hotel NOI" },
  { id: "4b263120-eb0b-438b-8e05-a273cd8590db", nombre: "Hotel Renaissance" },
  { id: "794193ce-c5d8-431f-b5af-dfb245c9e604", nombre: "Hotel Ritz" },
  { id: "1bbf8414-2737-434e-83d0-afe44cadb6d0", nombre: "Hotel W" },
  { id: "bf0e4f0f-636d-4629-82ee-df2bb3b60d6e", nombre: "Intercontinental" },
  { id: "bb368e72-1810-4233-8f6e-bf6ebc25af9a", nombre: "Las Pircas de Chicureo" },
  { id: "16bdd7c8-34b1-4434-bae8-626c30cf8792", nombre: "Metropolitan" },
  { id: "9f0feafe-2320-4b3a-8949-b16b6393e450", nombre: "Prince Of Wales" },
  { id: "ca24a8d5-6068-4354-94e3-110c36abdf14", nombre: "Reality Calera Tango" },
  { id: "d1b3092b-4343-4d11-95fb-583d89012d9f", nombre: "Salon Omnium" },
  { id: "da08a26e-753f-42a6-8397-33f50a3305f3", nombre: "Santiago Sky" },
  { id: "994af6fe-56c9-44e1-8ffe-b28998ed45fa", nombre: "Stadio Italiano" },
  { id: "82ee3b12-7148-4dcc-8a6a-64829f5f169c", nombre: "Universidad de Talca" },
  { id: "38b68c36-36a4-4cf0-a01e-4e427db82124", nombre: "UTEM" },
  { id: "cbb2712b-78d6-4d2f-9f8c-61faefcce9d5", nombre: "Viña Santa Carolina" },
  { id: "f229f2fe-5c2e-45d1-8f2e-16da5bc6ec97", nombre: "Viña Vik" },
];

export interface TecnicoPerfil {
  id: string;
  nombre_completo: string;
  rol: string;
  email?: string | null;
  telefono?: string | null;
  activo: boolean;
}

interface Evento {
  id: string;
  nombre: string;
  centro_id?: string | null;
  centros_eventos?: { id?: string; nombre: string } | null;
  locacion?: string | null;
  fecha_inicio: string;
  fecha_termino: string | null;
  estado: "planificado" | "en_curso" | "finalizado";
  metros_cuadrados: number | null;
  tipo_pantalla: string | null;
  created_at: string;
  tecnico_id?: string | null;
  perfiles?: {
    id: string;
    nombre_completo: string;
    rol: string;
    email?: string | null;
    telefono?: string | null;
  } | null;
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

  /* ─── Centros y Técnicos ─── */
  const [centros, setCentros] = useState<CentroEvento[]>(CENTROS_EVENTOS_FALLBACK);
  const [centroId, setCentroId] = useState<string>(CENTROS_EVENTOS_FALLBACK[0].id);
  const [tecnicos, setTecnicos] = useState<TecnicoPerfil[]>([]);
  const [tecnicoId, setTecnicoId] = useState<string>("");

  /* ─── Modal Quién Trabajó / Asignar Técnico ─── */
  const [modalEquipoAbierto, setModalEquipoAbierto] = useState(false);
  const [eventoParaEquipo, setEventoParaEquipo] = useState<Evento | null>(null);
  const [equipoParticipante, setEquipoParticipante] = useState<
    Array<{
      id: string;
      nombre_completo: string;
      rol: string;
      telefono?: string | null;
      total_incidencias: number;
      fecha_union?: string | null;
      ultima_actividad?: string | null;
    }>
  >([]);
  const [cargandoEquipo, setCargandoEquipo] = useState(false);
  const [nuevoTecnicoAsignadoId, setNuevoTecnicoAsignadoId] = useState<string>("");
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);

  /* ─── Formulario ─── */
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [metrosCuadrados, setMetrosCuadrados] = useState("80");
  const [tipoPantalla, setTipoPantalla] = useState("Pantalla Escenario P3.9 Outdoor");
  const [estadoInicial, setEstadoInicial] = useState<"planificado" | "en_curso">("planificado");

  /* ─── Fetch Centros de Eventos ─── */
  const fetchCentros = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("centros_eventos")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (!error && data && data.length > 0) {
        setCentros(data);
        setCentroId((prev) => {
          const exists = data.some((c: CentroEvento) => c.id === prev);
          return exists ? prev : data[0].id;
        });
      }
    } catch (err) {
      console.warn("Fallo al consultar centros_eventos en Cloud:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCentros();
  }, [fetchCentros]);

  /* ─── Fetch Eventos con Relación a Centros y Técnicos ─── */
  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: eventosData, error: evError },
        { data: perfilesData, error: perfError },
      ] = await Promise.all([
        supabase
          .from("eventos")
          .select("*, centros_eventos(nombre)")
          .order("fecha_inicio", { ascending: false }),
        supabase
          .from("perfiles")
          .select("id, nombre_completo, rol, email, telefono, activo")
          .order("nombre_completo", { ascending: true }),
      ]);

      if (evError) {
        console.error("Error al cargar eventos:", evError);
      }

      const listaTecnicos = (perfilesData || []) as TecnicoPerfil[];
      setTecnicos(listaTecnicos);

      if (eventosData) {
        const perfilesMap = new Map(listaTecnicos.map((p) => [p.id, p]));
        const eventosConEquipo: Evento[] = eventosData.map((ev: any) => ({
          ...ev,
          perfiles: ev.tecnico_id ? perfilesMap.get(ev.tecnico_id) || null : null,
        }));
        setEventos(eventosConEquipo);
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

  /* ─── Modal Quién Trabajó / Asignar Técnico ─── */
  const handleAbrirEquipo = async (ev: Evento) => {
    setEventoParaEquipo(ev);
    setNuevoTecnicoAsignadoId(ev.tecnico_id || "");
    setModalEquipoAbierto(true);
    setCargandoEquipo(true);

    try {
      const [
        { data: incs, error: incsErr },
        { data: parts, error: partsErr },
      ] = await Promise.all([
        supabase
          .from("incidencias")
          .select(`
            id,
            tecnico_id,
            fecha_ocurrencia,
            created_at,
            perfiles:tecnico_id ( id, nombre_completo, rol, email, telefono )
          `)
          .eq("evento_id", ev.id),
        supabase
          .from("evento_participantes")
          .select(`
            id,
            tecnico_id,
            fecha_union,
            activo,
            perfiles:tecnico_id ( id, nombre_completo, rol, email, telefono )
          `)
          .eq("evento_id", ev.id),
      ]);

      const mapa = new Map<
        string,
        {
          id: string;
          nombre_completo: string;
          rol: string;
          telefono?: string | null;
          total_incidencias: number;
          fecha_union?: string | null;
          ultima_actividad?: string | null;
        }
      >();

      // 1. Integrar participantes registrados en la producción
      if (!partsErr && parts) {
        parts.forEach((item: any) => {
          const perf = item.perfiles;
          const tid = item.tecnico_id || (perf ? perf.id : null);
          if (!tid) return;
          const tecEncontrado = tecnicos.find((t) => t.id === tid);
          mapa.set(tid, {
            id: tid,
            nombre_completo: perf?.nombre_completo || tecEncontrado?.nombre_completo || "Técnico en Terreno",
            rol: perf?.rol || tecEncontrado?.rol || "tecnico",
            telefono: perf?.telefono || tecEncontrado?.telefono || null,
            total_incidencias: 0,
            fecha_union: item.fecha_union,
            ultima_actividad: item.fecha_union,
          });
        });
      }

      // 2. Integrar incidencias reportadas en terreno
      if (!incsErr && incs) {
        incs.forEach((item: any) => {
          const perf = item.perfiles;
          const tid = item.tecnico_id || (perf ? perf.id : null);
          if (!tid) return;

          const tecEncontrado = tecnicos.find((t) => t.id === tid);
          const fecha = item.fecha_ocurrencia || item.created_at;

          if (mapa.has(tid)) {
            const actual = mapa.get(tid)!;
            actual.total_incidencias += 1;
            if (fecha && (!actual.ultima_actividad || new Date(fecha) > new Date(actual.ultima_actividad))) {
              actual.ultima_actividad = fecha;
            }
          } else {
            mapa.set(tid, {
              id: tid,
              nombre_completo: perf?.nombre_completo || tecEncontrado?.nombre_completo || "Técnico en Terreno",
              rol: perf?.rol || tecEncontrado?.rol || "tecnico",
              telefono: perf?.telefono || tecEncontrado?.telefono || null,
              total_incidencias: 1,
              fecha_union: null,
              ultima_actividad: fecha,
            });
          }
        });
      }

      setEquipoParticipante(Array.from(mapa.values()));
    } catch (err) {
      console.error("Error al consultar equipo participante:", err);
      setEquipoParticipante([]);
    } finally {
      setCargandoEquipo(false);
    }
  };

  const handleGuardarAsignacionTecnico = async () => {
    if (!eventoParaEquipo) return;
    setGuardandoAsignacion(true);

    try {
      const valorTecnicoId = nuevoTecnicoAsignadoId.trim() || null;
      const { error } = await supabase
        .from("eventos")
        .update({ tecnico_id: valorTecnicoId })
        .eq("id", eventoParaEquipo.id);

      if (error) {
        alert("Error al actualizar técnico: " + error.message);
      } else {
        const tecnicoElegido = tecnicos.find((t) => t.id === valorTecnicoId);
        setToastMsg(
          tecnicoElegido
            ? `Técnico ${tecnicoElegido.nombre_completo} asignado a ${eventoParaEquipo.nombre}.`
            : `Evento "${eventoParaEquipo.nombre}" dejado abierto para que cualquier técnico se una en terreno.`
        );
        setTimeout(() => setToastMsg(""), 3500);

        setEventos((prev) =>
          prev.map((e) =>
            e.id === eventoParaEquipo.id
              ? {
                  ...e,
                  tecnico_id: valorTecnicoId,
                  perfiles: tecnicoElegido
                    ? {
                        id: tecnicoElegido.id,
                        nombre_completo: tecnicoElegido.nombre_completo,
                        rol: tecnicoElegido.rol,
                        telefono: tecnicoElegido.telefono,
                      }
                    : null,
                }
              : e
          )
        );

        setModalEquipoAbierto(false);
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setGuardandoAsignacion(false);
    }
  };

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
    if (!nombre.trim() || !centroId || !fechaInicio) return;

    setGuardando(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const selectedCentro = centros.find((c) => c.id === centroId);
      const validCentroId = selectedCentro ? selectedCentro.id : (centros[0]?.id || null);
      const validLocacion = selectedCentro?.nombre || centros[0]?.nombre || "Recinto no especificado";

      const toIsoDate = (d: string) => {
        if (!d) return null;
        return d.includes("T") ? new Date(d).toISOString() : new Date(`${d}T12:00:00`).toISOString();
      };

      const { error } = await supabase.from("eventos").insert({
        nombre: nombre.trim(),
        centro_id: validCentroId,
        locacion: validLocacion,
        fecha_inicio: toIsoDate(fechaInicio),
        fecha_termino: toIsoDate(fechaTermino),
        estado: estadoInicial,
        metros_cuadrados: parseFloat(metrosCuadrados) || 0,
        tipo_pantalla: tipoPantalla,
        tecnico_id: tecnicoId.trim() || null,
      });

      if (error) {
        alert("Error al registrar evento: " + error.message);
      } else {
        setToastMsg("¡Evento registrado exitosamente en Supabase!");
        setTimeout(() => setToastMsg(""), 3500);
        setModalAbierto(false);
        setNombre("");
        setCentroId(centros[0]?.id || "");
        setFechaInicio("");
        setFechaTermino("");
        setTecnicoId("");
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
    const nombreRecinto = ev.centros_eventos?.nombre || ev.locacion || "";
    const coincideBusqueda =
      !q ||
      ev.nombre.toLowerCase().includes(q) ||
      nombreRecinto.toLowerCase().includes(q) ||
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer ${filtro === "todas"
                ? "bg-[var(--go)] text-[var(--gt)] card-shadow transition-shadow"
                : "text-[var(--mu)] hover:text-[var(--tx)]"
                }`}
            >
              Todos ({totalEventos})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("en_curso")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${filtro === "en_curso"
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${filtro === "planificado"
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-['Outfit'] uppercase tracking-wider font-semibold transition-all cursor-pointer ${filtro === "finalizado"
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
                  <th className="py-3.5 px-4 text-center">Metraje</th>
                  <th className="py-3.5 px-4">Fechas</th>
                  <th className="py-3.5 px-4 text-center">Equipo / Técnico</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-[var(--mu)]">
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
                            className={`w-3.5 h-3.5 rounded-full shrink-0 ${ev.estado === "en_curso"
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
                              {ev.centros_eventos?.nombre || ev.locacion || "Recinto no especificado"}
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
                      <td className="py-4 px-4 text-center align-middle">
                        <span className="px-2.5 py-1 rounded-md bg-[var(--sf2)] border border-[var(--bd)] text-xs font-mono font-bold text-[var(--pr)]">
                          {ev.metros_cuadrados || 0} m²
                        </span>
                      </td>

                      {/* Fechas */}
                      <td className="py-4 px-4 align-middle">
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

                      {/* Técnico / Equipo Asignado */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="flex items-center justify-center">
                          {ev.perfiles ? (
                            <button
                              type="button"
                              onClick={() => handleAbrirEquipo(ev)}
                              title="Ver quién operó en terreno o reasignar técnico encargado"
                              className="group/tec inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf2)]/80 border border-[var(--bd)] hover:border-[var(--pr)]/50 transition-all cursor-pointer shadow-sm text-left active:scale-95"
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm ${
                                  ev.perfiles.rol === "admin"
                                    ? "bg-[#F59E0B] text-black"
                                    : ev.perfiles.rol === "coordinador"
                                    ? "bg-[#2563EB]"
                                    : "bg-emerald-500"
                                }`}
                              >
                                {ev.perfiles.nombre_completo.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0 pr-1">
                                <span className="text-xs font-bold text-[var(--tx)] truncate max-w-[120px] group-hover/tec:text-[var(--pr)] transition-colors">
                                  {ev.perfiles.nombre_completo}
                                </span>
                                <span className="text-[10px] text-[var(--mu)] capitalize leading-tight">
                                  {ev.perfiles.rol === "tecnico" ? "Técnico Terreno" : ev.perfiles.rol}
                                </span>
                              </div>
                              <span className="material-symbols-outlined text-sm text-[var(--mu)] group-hover/tec:text-[var(--pr)] transition-colors">
                                groups
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAbrirEquipo(ev)}
                              title="Ver personal en terreno o asignar técnico responsable"
                              className="group/tec inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/40 text-amber-500 text-[11px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Abierto · Por unirse</span>
                              <span className="material-symbols-outlined text-sm opacity-70 group-hover/tec:opacity-100 transition-opacity">
                                groups
                              </span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4 text-center align-middle">
                        {ev.estado === "en_curso" ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-['Outfit'] font-bold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            En Curso
                          </span>
                        ) : ev.estado === "planificado" ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-[#D4AF37] font-['Outfit'] font-bold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#D4AF37]" />
                            Planificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/15 border border-zinc-500/30 text-zinc-600 dark:text-[#A1A1AA] font-['Outfit'] font-bold text-[10.5px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            Finalizado
                          </span>
                        )}
                      </td>

                      {/* Selector de Estado Rápido (Columna Gestión) */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <select
                          value={ev.estado}
                          disabled={actualizandoId === ev.id}
                          onChange={(e) =>
                            handleCambiarEstado(ev.id, e.target.value as Evento["estado"])
                          }
                          style={{ colorScheme: "dark" }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-['Outfit'] uppercase tracking-wider font-bold border transition-all cursor-pointer focus:outline-none shadow-sm ${
                            ev.estado === "en_curso"
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                              : ev.estado === "planificado"
                              ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-[#D4AF37] hover:bg-amber-500/25"
                              : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
                          }`}
                          title="Cambiar estado del evento"
                        >
                          <option value="en_curso" className="bg-[#18181B] text-emerald-400 font-bold py-2">
                            ● En Curso
                          </option>
                          <option value="planificado" className="bg-[#18181B] text-[#D4AF37] font-bold py-2">
                            ● Planificado
                          </option>
                          <option value="finalizado" className="bg-[#18181B] text-[#A1A1AA] font-bold py-2">
                            ● Finalizado
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-[#71717A]">
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
                  Centro de Eventos / Recinto *
                </label>
                <select
                  required
                  value={centroId}
                  onChange={(e) => setCentroId(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all cursor-pointer"
                >
                  {centros.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                    Fecha de Término (Opcional)
                  </label>
                  <input
                    type="date"
                    value={fechaTermino}
                    onChange={(e) => setFechaTermino(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all cursor-pointer"
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
                    style={{ colorScheme: "dark" }}
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] font-semibold focus:outline-none focus:border-[var(--pr)] transition-all cursor-pointer"
                  >
                    <option value="planificado" className="bg-[#18181B] text-[#D4AF37] font-semibold py-2">
                      ● Planificado (Próximo)
                    </option>
                    <option value="en_curso" className="bg-[#18181B] text-emerald-400 font-semibold py-2">
                      ● En Curso (Activar Ahora)
                    </option>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Técnico Asignado / Responsable (Opcional)
                </label>
                <select
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all cursor-pointer"
                >
                  <option value="">● Dejar Abierto (Cualquier técnico puede unirse desde la app móvil)</option>
                  {tecnicos
                    .filter((t) => t.activo !== false)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre_completo} ({t.rol === "tecnico" ? "Técnico" : t.rol}) {t.telefono ? `· ${t.telefono}` : ""}
                      </option>
                    ))}
                </select>
                <span className="text-[11px] text-[var(--mu)]">
                  Si lo dejas abierto, los técnicos verán la producción disponible en su app móvil y podrán unirse al llegar al recinto.
                </span>
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

      {/* ── Modal Equipo del Evento / Quién Trabajó ── */}
      {modalEquipoAbierto && eventoParaEquipo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[var(--sf)] border border-[var(--bd)] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--go)]/15 border border-[var(--pr)]/30 flex items-center justify-center text-[var(--pr)]">
                  <span className="material-symbols-outlined text-xl">groups</span>
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-semibold text-[var(--tx)]">
                    Equipo de Producción en Terreno
                  </h3>
                  <span className="text-[11px] text-[var(--mu)]">
                    {eventoParaEquipo.nombre} · {eventoParaEquipo.centros_eventos?.nombre || eventoParaEquipo.locacion}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEquipoAbierto(false)}
                className="w-8 h-8 rounded-lg bg-[var(--sf2)] hover:bg-[var(--sf2)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Sección 1: Asignar / Cambiar Técnico Titular */}
            <div className="p-4 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-['Outfit'] uppercase font-semibold text-[var(--tx)] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[var(--pr)]">person_check</span>
                  Técnico Responsable Asignado
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  eventoParaEquipo.tecnico_id
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                }`}>
                  {eventoParaEquipo.tecnico_id ? "Asignado formalmente" : "Abierto para auto-unión"}
                </span>
              </div>

              <p className="text-xs text-[var(--mu)]">
                Puedes asignar a un técnico específico o dejar la producción abierta para que el personal en terreno tome el turno desde la app móvil.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                <select
                  value={nuevoTecnicoAsignadoId}
                  onChange={(e) => setNuevoTecnicoAsignadoId(e.target.value)}
                  className="flex-1 h-10 px-3 bg-[var(--sf)] border border-[var(--bd)] rounded-xl text-[16px] md:text-xs text-[var(--tx)] focus:outline-none focus:border-[var(--pr)] transition-all cursor-pointer"
                >
                  <option value="">● Dejar Abierto (Cualquiera puede unirse)</option>
                  {tecnicos
                    .filter((t) => t.activo !== false)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre_completo} ({t.rol === "tecnico" ? "Técnico" : t.rol}) {t.telefono ? `· ${t.telefono}` : ""}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  disabled={guardandoAsignacion}
                  onClick={handleGuardarAsignacionTecnico}
                  className="px-4 py-2 rounded-xl bg-[var(--go)] hover:bg-[#C5A059] text-[var(--gt)] font-['Outfit'] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <span className={`material-symbols-outlined text-sm ${guardandoAsignacion ? "animate-spin" : ""}`}>
                    {guardandoAsignacion ? "progress_activity" : "save"}
                  </span>
                  <span>{guardandoAsignacion ? "Guardando..." : "Guardar"}</span>
                </button>
              </div>
            </div>

            {/* Sección 2: Quién Trabajó en este Evento (Registro Fáctico en Terreno) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-['Outfit'] text-xs font-semibold text-[var(--tx)] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[var(--pr)]">engineering</span>
                  Personal y Técnicos que Operaron en Terreno
                </h4>
                <span className="text-[11px] text-[var(--mu)] font-mono">
                  {equipoParticipante.length} colaboradore(s)
                </span>
              </div>

              {cargandoEquipo ? (
                <div className="py-8 text-center text-xs text-[var(--mu)] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base animate-spin text-[var(--pr)]">
                    progress_activity
                  </span>
                  <span>Consultando registros de actividad en terreno...</span>
                </div>
              ) : equipoParticipante.length > 0 ? (
                <div className="divide-y divide-[var(--bd)] border border-[var(--bd)] rounded-xl overflow-hidden bg-[var(--sf2)]/40">
                  {equipoParticipante.map((tec) => (
                    <div key={tec.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--sf2)] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                          {tec.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-[var(--tx)] truncate">
                              {tec.nombre_completo}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--prs)] border border-[var(--pr)]/30 text-[var(--pr)] text-[9.5px] font-bold">
                              Colaborador
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--mu)] flex items-center gap-2 mt-0.5">
                            <span className="capitalize">{tec.rol}</span>
                            {tec.telefono && (
                              <span>• Tel: {tec.telefono}</span>
                            )}
                            {tec.fecha_union && (
                              <span>• Unión: {new Date(tec.fecha_union).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--sf)] border border-[var(--bd)] text-[10.5px] font-mono font-bold text-[var(--pr)]">
                          {tec.total_incidencias} reporte(s) / acción(es)
                        </span>
                        {tec.ultima_actividad && (
                          <span className="text-[10px] text-[#71717A] mt-0.5">
                            Último: {new Date(tec.ultima_actividad).toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-[var(--bd)] text-center flex flex-col items-center justify-center gap-2 bg-[var(--sf2)]/20">
                  <span className="material-symbols-outlined text-2xl text-[var(--mu)]">
                    person_off
                  </span>
                  <p className="text-xs text-[var(--mu)]">
                    Aún no hay técnicos con actividad ni incidencias reportadas en terreno para esta producción.
                  </p>
                  <span className="text-[10.5px] text-[#71717A]">
                    Cualquier técnico registrado que opere o reporte averías en este montaje aparecerá automáticamente aquí.
                  </span>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end pt-3 border-t border-[var(--bd)]">
              <button
                type="button"
                onClick={() => setModalEquipoAbierto(false)}
                className="px-4 py-2 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf2)] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[var(--mu)] hover:text-[var(--tx)] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
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
            Módulo de Producciones v1.0
          </span>
        </div>
      </footer>
    </>
  );
}
