import { supabase } from './supabase';
import {
  getAllLocalIncidencias,
  getAllLocalEventos,
  getActiveLocalEventos,
  LocalIncidencia,
  LocalEvento,
  insertLocalIncidencia,
} from '../db/database';
import { uploadEvidenceImage, resolveEventoUuid, resolvePalmetaUuid } from './sync';

export interface ReportIncidentParams {
  qrUuid: string;
  tipoFalla: string;
  fotoUri?: string;
  observaciones?: string;
  eventoIdOrNombre?: string;
  eventoId?: string;
  usuarioId?: string;
}

export interface ActiveEventOption {
  id: string;
  nombre: string;
  locacion?: string;
}

export interface ReportIncidentResult {
  success: boolean;
  mode: 'cloud' | 'offline';
  message: string;
  incidentId?: string | number;
}

export interface UnifiedIncident {
  id: string;
  qr_uuid: string;
  codigo_visible?: string;
  tipo_falla: string;
  descripcion?: string | null;
  foto_url?: string | null;
  fecha: string;
  evento_id?: string | null;
  evento_nombre?: string | null;
  is_local: boolean;
  sincronizado: boolean;
  resuelto?: boolean;
}

export interface EventFilterOption {
  id: string;
  nombre: string;
  incidentCount?: number;
}

/**
 * Normaliza y combina incidencias desde SQLite local y Supabase Cloud
 * Proporciona trazabilidad completa y resiliencia offline.
 */
export const fetchHybridIncidents = async (options?: {
  eventId?: string;
  limit?: number;
}): Promise<UnifiedIncident[]> => {
  const combined: UnifiedIncident[] = [];
  const localEvents: LocalEvento[] = getAllLocalEventos();
  const eventNameMap = new Map<string, string>();

  localEvents.forEach((ev) => {
    eventNameMap.set(ev.id, ev.nombre);
    eventNameMap.set(ev.nombre, ev.nombre);
  });

  // 1. Cargar incidencias locales desde SQLite
  try {
    const localRows: LocalIncidencia[] = getAllLocalIncidencias();
    localRows.forEach((row) => {
      const resolvedEventName =
        (row.evento_id && eventNameMap.get(row.evento_id)) ||
        row.evento_id ||
        'Evento en terreno';

      combined.push({
        id: `local-${row.id}`,
        qr_uuid: row.qr_uuid,
        tipo_falla: row.tipo_falla || 'Incidencia General',
        descripcion: row.observaciones || null,
        foto_url: row.foto_uri || null,
        fecha: row.fecha,
        evento_id: row.evento_id || null,
        evento_nombre: resolvedEventName,
        is_local: true,
        sincronizado: Boolean(row.sincronizado),
        resuelto: false,
      });
    });
  } catch (localErr) {
    console.warn('Error leyendo incidencias locales SQLite:', localErr);
  }

  // 2. Cargar incidencias remotas desde Supabase Cloud
  try {
    const { data: remoteData, error } = await supabase
      .from('incidencias')
      .select(`
        id,
        qr_uuid,
        tipo_falla,
        descripcion,
        foto_url,
        fecha_ocurrencia,
        resuelto,
        created_at,
        evento_id,
        eventos (
          id,
          nombre
        ),
        palmetas_led (
          codigo_visible
        )
      `)
      .order('fecha_ocurrencia', { ascending: false });

    if (!error && remoteData) {
      remoteData.forEach((r: any) => {
        const remoteEventName = r.eventos?.nombre || (r.evento_id && eventNameMap.get(r.evento_id)) || 'Evento no especificado';
        const remoteVisibleCode = r.palmetas_led?.codigo_visible || undefined;
        const remoteDate = r.fecha_ocurrencia || r.created_at;

        // Verificar si ya existe en la lista local (evitar duplicados entre sync y local)
        const duplicateIdx = combined.findIndex((c) => {
          if (c.qr_uuid !== r.qr_uuid) return false;
          const diffMs = Math.abs(new Date(c.fecha).getTime() - new Date(remoteDate).getTime());
          return diffMs < 120000; // Mismo registro si difiere en menos de 2 minutos
        });

        const remoteItem: UnifiedIncident = {
          id: r.id,
          qr_uuid: r.qr_uuid,
          codigo_visible: remoteVisibleCode,
          tipo_falla: r.tipo_falla || 'Falla Técnica',
          descripcion: r.descripcion || null,
          foto_url: r.foto_url || null,
          fecha: remoteDate,
          evento_id: r.evento_id || null,
          evento_nombre: remoteEventName,
          is_local: false,
          sincronizado: true,
          resuelto: Boolean(r.resuelto),
        };

        if (duplicateIdx >= 0) {
          // Reemplazar la versión local pendiente con la confirmada de la nube
          combined[duplicateIdx] = remoteItem;
        } else {
          combined.push(remoteItem);
        }
      });
    } else if (error) {
      console.warn('Consulta remota de incidencias a Supabase falló (modo offline activo):', error.message);
    }
  } catch (cloudErr: any) {
    console.warn('Excepción consultando incidencias en Supabase:', cloudErr?.message);
  }

  // 3. Filtrar por evento si se especificó y no es 'all'
  let filtered = combined;
  if (options?.eventId && options.eventId !== 'all') {
    const targetId = options.eventId.toLowerCase();
    filtered = combined.filter((item) => {
      const matchId = item.evento_id?.toLowerCase() === targetId;
      const matchName = item.evento_nombre?.toLowerCase() === targetId;
      const partialMatch = item.evento_nombre?.toLowerCase().includes(targetId);
      return matchId || matchName || partialMatch;
    });
  }

  // 4. Ordenar siempre por fecha descendente (más reciente primero)
  filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // 5. Aplicar límite si corresponde
  if (options?.limit && options.limit > 0) {
    return filtered.slice(0, options.limit);
  }

  return filtered;
};

/**
 * Consulta y unifica la lista de eventos disponibles para los filtros de historial
 */
export const fetchFilterEvents = async (): Promise<EventFilterOption[]> => {
  const eventsMap = new Map<string, EventFilterOption>();

  // 1. Agregar eventos locales primero
  try {
    const localEvents = getAllLocalEventos();
    localEvents.forEach((e) => {
      if (e.id && e.nombre) {
        eventsMap.set(e.id, { id: e.id, nombre: e.nombre });
      }
    });
  } catch (err) {
    console.warn('Error leyendo eventos locales para filtro:', err);
  }

  // 2. Consultar eventos en Supabase Cloud
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('id, nombre, estado')
      .order('fecha_inicio', { ascending: false });

    if (!error && data) {
      data.forEach((e: any) => {
        if (e.id && e.nombre) {
          eventsMap.set(e.id, { id: e.id, nombre: e.nombre });
        }
      });
    }
  } catch (cloudErr) {
    console.warn('Error consultando eventos en Supabase para filtro:', cloudErr);
  }

  const list = Array.from(eventsMap.values());
  return list;
};

/**
 * Consulta la lista de eventos cuyo estado sea 'en_curso'.
 * Utiliza Supabase Cloud en primera instancia con fallback automático a la caché SQLite.
 */
export const fetchActiveEvents = async (): Promise<ActiveEventOption[]> => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('id, nombre, locacion')
      .eq('estado', 'en_curso')
      .order('fecha_inicio', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((e: any) => ({
        id: String(e.id),
        nombre: String(e.nombre),
        locacion: e.locacion ? String(e.locacion) : undefined,
      }));
    }
  } catch (cloudErr) {
    console.warn('Error consultando eventos activos en Supabase:', cloudErr);
  }

  // Fallback a SQLite local
  try {
    const local = getActiveLocalEventos();
    return local.map((e) => ({
      id: String(e.id),
      nombre: String(e.nombre),
      locacion: e.locacion ? String(e.locacion) : undefined,
    }));
  } catch (localErr) {
    console.warn('Error consultando eventos activos en SQLite:', localErr);
    return [];
  }
};

/**
 * Mutación Online-First con Offline-Fallback para "Reportar Falla" de una palmeta.
 * 1. Intenta realizar el reporte directamente en Supabase (Storage para fotos + Tabla incidencias).
 * 2. Si la llamada de red falla (fetch failed, Network request failed, timeout o modo offline),
 *    el bloque catch encola inmediatamente la incidencia en la base de datos local SQLite (incidencias_locales).
 * 3. No usa NetInfo para bloquear la petición; lanza directamente el fetch a Supabase.
 */
export const reportIncident = async (
  params: ReportIncidentParams
): Promise<ReportIncidentResult> => {
  const cleanQr = params.qrUuid.trim();
  if (!cleanQr) {
    throw new Error('Código QR de la palmeta requerido');
  }

  const effectiveEvent = params.eventoId || params.eventoIdOrNombre || 'Festival Estadio Nacional';
  const tipoFalla = params.tipoFalla || 'Escaneo Operativo';
  const observaciones = params.observaciones?.trim() || null;

  // 1. Intento Online-First directo a Supabase
  try {
    let remoteFotoUrl: string | null = null;
    if (params.fotoUri) {
      remoteFotoUrl = await uploadEvidenceImage(params.fotoUri);
    }

    let tecnicoId: string | null = params.usuarioId ?? null;
    if (!tecnicoId) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        tecnicoId = userData?.user?.id ?? null;
      } catch {
        // Ignorar si no hay sesión
      }
    }

    const eventoUuid = await resolveEventoUuid(effectiveEvent);
    const palmetaUuid = await resolvePalmetaUuid(cleanQr);

    const { data: insertedData, error: insertError } = await supabase
      .from('incidencias')
      .insert({
        qr_uuid: cleanQr,
        palmeta_id: palmetaUuid,
        evento_id: eventoUuid,
        tecnico_id: tecnicoId,
        tipo_falla: tipoFalla,
        descripcion: observaciones,
        foto_url: remoteFotoUrl,
        fecha_ocurrencia: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    // Si la falla reportada es una baja definitiva, actualizar también palmetas_led
    if (tipoFalla.toLowerCase().includes('baja')) {
      const updateQuery = supabase
        .from('palmetas_led')
        .update({
          estado: 'baja',
          ubicacion_actual: 'desecho',
          updated_at: new Date().toISOString(),
        });
      if (palmetaUuid) {
        await updateQuery.eq('id', palmetaUuid);
      } else {
        await updateQuery.or(`codigo_qr.eq.${cleanQr},qr_uuid.eq.${cleanQr}`);
      }
    }

    return {
      success: true,
      mode: 'cloud',
      message: 'Falla reportada y sincronizada en tiempo real con Supabase.',
      incidentId: insertedData?.id,
    };
  } catch (networkError: any) {
    console.warn('[Online-First] Falló reporte a Supabase, aplicando Offline-Fallback:', networkError?.message);

    // Resolver tecnicoId para almacenamiento local resiliente
    let tecnicoIdLocal: string | undefined = params.usuarioId;

    // 2. Offline-Fallback (Catch & Queue en SQLite)
    try {
      const localId = insertLocalIncidencia(
        cleanQr,
        tipoFalla,
        params.fotoUri,
        observaciones || undefined,
        effectiveEvent,
        tecnicoIdLocal
      );

      return {
        success: true,
        mode: 'offline',
        message: 'Guardado localmente. Se sincronizará cuando haya conexión.',
        incidentId: localId,
      };
    } catch (localDbError: any) {
      console.error('Error guardando incidencia en SQLite local:', localDbError);
      throw new Error('No se pudo guardar la incidencia en el almacenamiento local.');
    }
  }
};
