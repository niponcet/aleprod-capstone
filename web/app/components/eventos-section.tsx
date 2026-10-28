"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Evento {
  id: string;
  nombre: string;
  locacion: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  estado: "planificado" | "en_curso" | "finalizado";
  metros_cuadrados?: number | null;
  tipo_pantalla?: string | null;
}

interface EventosSectionProps {
  initialEventos: Evento[];
}

export function EventosSection({ initialEventos }: EventosSectionProps) {
  const supabase = createClient();
  const [eventos, setEventos] = useState<Evento[]>(initialEventos);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  /* ── Formulario Nuevo Evento ── */
  const [nombre, setNombre] = useState("");
  const [locacion, setLocacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [metrosCuadrados, setMetrosCuadrados] = useState("80");
  const [tipoPantalla, setTipoPantalla] = useState("Pantalla Escenario P3.9 Outdoor");
  const [estadoInicial, setEstadoInicial] = useState<"planificado" | "en_curso">("planificado");

  const refreshEventos = useCallback(async () => {
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .order("fecha_inicio", { ascending: false });

    if (data) {
      setEventos(data as Evento[]);
    }
  }, [supabase]);

  /* ── Cambiar Estado de un Evento ── */
  const handleCambiarEstado = async (eventoId: string, nuevoEstado: Evento["estado"]) => {
    setActualizandoId(eventoId);
    try {
      // Si se marca como en_curso, opcionalmente podemos dejar fecha_termino en null
      const updateData: any = {
        estado: nuevoEstado,
      };
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
        setToastMsg(`Evento actualizado a "${nuevoEstado.replace("_", " ").toUpperCase()}"`);
        setTimeout(() => setToastMsg(""), 3500);
        await refreshEventos();
      }
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    } finally {
      setActualizandoId(null);
    }
  };

  /* ── Guardar Nuevo Evento ── */
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
        alert("Error al crear evento: " + error.message);
      } else {
        setToastMsg("¡Evento registrado exitosamente en Supabase!");
        setTimeout(() => setToastMsg(""), 3500);
        setModalAbierto(false);
        // Reset form
        setNombre("");
        setLocacion("");
        setFechaInicio("");
        setFechaTermino("");
        setMetrosCuadrados("80");
        await refreshEventos();
      }
    } catch (err) {
      console.error("Error al crear evento:", err);
    } finally {
      setGuardando(false);
    }
  };

  const totalEventos = eventos.length;

  return (
    <div className="p-6 rounded-2xl bg-[#121212] border border-[#27272A] shadow-xl flex flex-col gap-6 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-40 px-4 py-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-['Outfit'] font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#27272A] pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#D4AF37] text-xl">
            calendar_month
          </span>
          <div>
            <h2 className="font-['Outfit'] text-[#FFFFFF] text-lg font-semibold">
              Eventos y Producciones Registradas
            </h2>
            <span className="text-[11px] text-[#71717A]">
              Control de cronograma, locaciones y estado de turnos en vivo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="font-['Outfit'] text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold mr-1">
            {totalEventos} Registrados
          </span>

          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C5A059] text-[#0A0A0A] font-['Outfit'] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* Lista de Eventos */}
      {eventos && eventos.length > 0 ? (
        <div className="flex flex-col gap-3">
          {eventos.map((ev) => (
            <div
              key={ev.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                ev.estado === "en_curso"
                  ? "bg-[#1E1E1E] border-[#10B981]/40 shadow-md shadow-[#10B981]/5"
                  : "bg-[#1E1E1E]/80 border-[#27272A] hover:border-[#3F3F46]"
              }`}
            >
              {/* Información Principal */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                    ev.estado === "en_curso"
                      ? "bg-[#10B981] animate-pulse shadow-sm shadow-[#10B981]"
                      : ev.estado === "planificado"
                      ? "bg-[#D4AF37]"
                      : "bg-[#71717A]"
                  }`}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-['Outfit'] text-sm sm:text-base font-semibold text-[#FFFFFF]">
                      {ev.nombre}
                    </span>
                    {ev.metros_cuadrados && ev.metros_cuadrados > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-[10px] text-[#D4AF37] font-mono">
                        {ev.metros_cuadrados} m²
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-[#A1A1AA] mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#71717A]">
                      location_on
                    </span>
                    {ev.locacion || "Locación por confirmar"}
                  </span>
                  {ev.tipo_pantalla && (
                    <span className="text-[10.5px] text-[#71717A] mt-0.5">
                      Configuración: {ev.tipo_pantalla}
                    </span>
                  )}
                </div>
              </div>

              {/* Fechas y Selector de Estado */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#27272A]">
                <div className="flex flex-col sm:items-end text-xs text-[#71717A]">
                  <span className="text-[#A1A1AA]">
                    {new Date(ev.fecha_inicio).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[10px]">
                    {ev.fecha_termino
                      ? `Hasta ${new Date(ev.fecha_termino).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                        })}`
                      : "En desarrollo"}
                  </span>
                </div>

                {/* Dropdown / Botón Selector de Estado */}
                <select
                  value={ev.estado}
                  disabled={actualizandoId === ev.id}
                  onChange={(e) =>
                    handleCambiarEstado(ev.id, e.target.value as Evento["estado"])
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-[16px] md:text-xs font-['Outfit'] uppercase tracking-wider font-semibold border transition-all cursor-pointer focus:outline-none ${
                    ev.estado === "en_curso"
                      ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 hover:bg-[#10B981]/25"
                      : ev.estado === "planificado"
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37]/25"
                      : "bg-[#27272A] text-[#71717A] border-[#3F3F46] hover:text-[#A1A1AA]"
                  }`}
                  title="Cambiar estado del evento"
                >
                  <option value="en_curso" className="bg-[#121212] text-[#10B981]">
                    ● En Curso
                  </option>
                  <option value="planificado" className="bg-[#121212] text-[#D4AF37]">
                    ● Planificado
                  </option>
                  <option value="finalizado" className="bg-[#121212] text-[#71717A]">
                    ● Finalizado
                  </option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-[#71717A] bg-[#1E1E1E] rounded-xl border border-dashed border-[#27272A]">
          No hay eventos cargados en la base de datos central.
        </div>
      )}

      {/* ── Modal Nuevo Evento ── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121212] border border-[#27272A] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <span className="material-symbols-outlined text-xl">add_circle</span>
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-semibold text-[#FFFFFF]">
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
                className="w-8 h-8 rounded-lg bg-[#1E1E1E] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearEvento} className="flex flex-col gap-4">
              {/* Nombre del Evento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-['Outfit']">
                  Nombre del Evento / Producción
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Lollapalooza 2026 · Escenario Perry's"
                  className="w-full h-10 px-3 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] placeholder-[#71717A] focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>

              {/* Locación */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-['Outfit']">
                  Locación / Recinto
                </label>
                <input
                  type="text"
                  required
                  value={locacion}
                  onChange={(e) => setLocacion(e.target.value)}
                  placeholder="Ej: Parque Bicentenario de Cerrillos, Santiago"
                  className="w-full h-10 px-3 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] placeholder-[#71717A] focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>

              {/* Fechas Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-['Outfit']">
                    Fecha y Hora de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-['Outfit']">
                    Fecha de Término (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaTermino}
                    onChange={(e) => setFechaTermino(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              {/* Metros Cuadrados y Tipo Pantalla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-['Outfit']">
                    Metros Cuadrados (m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={metrosCuadrados}
                    onChange={(e) => setMetrosCuadrados(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-['Outfit']">
                    Estado Inicial
                  </label>
                  <select
                    value={estadoInicial}
                    onChange={(e) =>
                      setEstadoInicial(e.target.value as "planificado" | "en_curso")
                    }
                    className="w-full h-10 px-3 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37] transition-all"
                  >
                    <option value="planificado">● Planificado (Próximo)</option>
                    <option value="en_curso">● En Curso (Activar Ahora)</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Pantalla */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider font-['Outfit']">
                  Configuración Técnica
                </label>
                <select
                  value={tipoPantalla}
                  onChange={(e) => setTipoPantalla(e.target.value)}
                  className="w-full h-10 px-3 bg-[#1E1E1E] border border-[#27272A] rounded-xl text-[16px] md:text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37] transition-all"
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

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] text-xs font-['Outfit'] uppercase tracking-wider font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C5A059] text-[#0A0A0A] font-['Outfit'] font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#D4AF37]/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
    </div>
  );
}
