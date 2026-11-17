"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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

export interface Evento {
  id: string;
  nombre: string;
  centro_id?: string | null;
  centros_eventos?: { id?: string; nombre: string } | null;
  locacion?: string | null;
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

  /* ── Centros de Eventos ── */
  const [centros, setCentros] = useState<CentroEvento[]>(CENTROS_EVENTOS_FALLBACK);
  const [centroId, setCentroId] = useState<string>(CENTROS_EVENTOS_FALLBACK[0].id);

  /* ── Formulario Nuevo Evento ── */
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [metrosCuadrados, setMetrosCuadrados] = useState("80");
  const [tipoPantalla, setTipoPantalla] = useState("Pantalla Escenario P3.9 Outdoor");
  const [estadoInicial, setEstadoInicial] = useState<"planificado" | "en_curso">("planificado");

  const refreshEventos = useCallback(async () => {
    const { data } = await supabase
      .from("eventos")
      .select("*, centros_eventos(nombre)")
      .order("fecha_inicio", { ascending: false });

    if (data) {
      setEventos(data as Evento[]);
    }
  }, [supabase]);

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
      console.warn("Fallo al consultar centros_eventos:", err);
    }
  }, [supabase]);

  // Cargar centros al inicializar
  useState(() => {
    fetchCentros();
  });

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
        setCentroId(centros[0]?.id || "");
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
    <div className="p-6 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] shadow-xl flex flex-col gap-6 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-40 px-4 py-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-['Outfit'] font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--bd)] pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[var(--pr)] text-xl">
            calendar_month
          </span>
          <div>
            <h2 className="font-['Outfit'] text-[var(--tx)] text-lg font-semibold">
              Eventos y Producciones Registradas
            </h2>
            <span className="text-[11px] text-[#71717A]">
              Control de cronograma, locaciones y estado de turnos en vivo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="font-['Outfit'] text-xs text-[var(--mu)] uppercase tracking-wider font-semibold mr-1">
            {totalEventos} Registrados
          </span>

          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--go)] hover:bg-[#C5A059] text-[var(--gt)] font-['Outfit'] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
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
                  ? "bg-[var(--sf2)] border-[#10B981]/40 card-shadow transition-shadow shadow-[#10B981]/5"
                  : "bg-[var(--sf2)]/80 border-[var(--bd)] hover:border-[var(--border-light)]"
              }`}
            >
              {/* Información Principal */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                    ev.estado === "en_curso"
                      ? "bg-[#10B981] animate-pulse shadow-sm shadow-[#10B981]"
                      : ev.estado === "planificado"
                      ? "bg-[var(--go)]"
                      : "bg-[#71717A]"
                  }`}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-['Outfit'] text-sm sm:text-base font-semibold text-[var(--tx)]">
                      {ev.nombre}
                    </span>
                    {ev.metros_cuadrados && ev.metros_cuadrados > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-[10px] text-[var(--pr)] font-mono">
                        {ev.metros_cuadrados} m²
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-[var(--mu)] mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#71717A]">
                      location_on
                    </span>
                    {ev.centros_eventos?.nombre || ev.locacion || "Locación por confirmar"}
                  </span>
                  {ev.tipo_pantalla && (
                    <span className="text-[10.5px] text-[#71717A] mt-0.5">
                      Configuración: {ev.tipo_pantalla}
                    </span>
                  )}
                </div>
              </div>

              {/* Fechas y Selector de Estado */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--bd)]">
                <div className="flex flex-col sm:items-end text-xs text-[#71717A]">
                  <span className="text-[var(--mu)]">
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
                  style={{ colorScheme: "dark" }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-['Outfit'] uppercase tracking-wider font-bold border transition-all cursor-pointer focus:outline-none shadow-sm ${
                    ev.estado === "en_curso"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25"
                      : ev.estado === "planificado"
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37]/25"
                      : "bg-[#27272A] text-[#A1A1AA] border-[var(--border-light)] hover:text-white"
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-[#71717A] bg-[var(--sf2)] rounded-xl border border-dashed border-[var(--bd)]">
          No hay eventos cargados en la base de datos central.
        </div>
      )}

      {/* ── Modal Nuevo Evento ── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--sf)] border border-[var(--bd)] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--go)]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[var(--pr)]">
                  <span className="material-symbols-outlined text-xl">add_circle</span>
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
              {/* Nombre del Evento */}
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
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>

              {/* Centro de Eventos Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Centro de Eventos / Recinto *
                </label>
                <select
                  required
                  value={centroId}
                  onChange={(e) => setCentroId(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                >
                  {centros.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fechas Grid */}
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
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
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
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Metros Cuadrados y Tipo Pantalla */}
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
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[#D4AF37] transition-all"
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
                    className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[#D4AF37] transition-all"
                  >
                    <option value="planificado">● Planificado (Próximo)</option>
                    <option value="en_curso">● En Curso (Activar Ahora)</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Pantalla */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider font-['Outfit']">
                  Configuración Técnica
                </label>
                <select
                  value={tipoPantalla}
                  onChange={(e) => setTipoPantalla(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--sf2)] border border-[var(--bd)] rounded-xl text-[16px] md:text-sm text-[var(--tx)] focus:outline-none focus:border-[#D4AF37] transition-all"
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
    </div>
  );
}
