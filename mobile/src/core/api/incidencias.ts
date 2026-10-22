import { supabase } from './supabase';
import {
  getAllLocalIncidencias,
  getAllLocalEventos,
  LocalIncidencia,
  LocalEvento,
} from '../db/database';

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
