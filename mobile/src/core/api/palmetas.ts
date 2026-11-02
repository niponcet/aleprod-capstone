import { supabase } from './supabase';
import {
  insertPendingPalmeta,
  isPalmetaPending,
  insertLocalIncidencia,
} from '../db/database';

export interface DecommissionResult {
  success: boolean;
  mode: 'cloud' | 'offline';
  message: string;
}

export type ProvisionStatus =
  | 'cloud_created'
  | 'offline_queued'
  | 'duplicate'
  | 'error';

export interface ProvisionResult {
  success: boolean;
  status: ProvisionStatus;
  message: string;
  qrCode: string;
  lote: string;
  isDuplicate?: boolean;
}

/**
 * Calcula el código legible humano oficial:
 * 'PL-' + últimos 6 caracteres alfanuméricos en mayúsculas del qr_uuid (eliminando guiones)
 */
export const deriveCodigoVisible = (qrUuid: string): string => {
  const clean = (qrUuid || '').replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length >= 6) {
    return `PL-${clean.slice(-6).toUpperCase()}`;
  }
  if (clean.length > 0) {
    return `PL-${clean.padStart(6, '0').toUpperCase()}`;
  }
  return 'PL-000000';
};

/**
 * Genera el código de lote con el formato LOTE-MMYYYY (ej. LOTE-102026)
 */
export const generateLoteIngreso = (date: Date = new Date()): string => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `LOTE-${mm}${yyyy}`;
};

/**
 * HU-13: Aprovisionamiento Masivo (Modo Ráfaga)
 * Inserta la palmeta en Supabase 'palmetas_led' o respalda en SQLite si no hay conexión.
 * Detecta duplicados tanto en la nube como localmente sin detener el flujo.
 */
export const provisionPalmeta = async (
  qrCode: string,
  customLote?: string
): Promise<ProvisionResult> => {
  const cleanCode = qrCode.trim();
  const lote = customLote?.trim() || generateLoteIngreso();

  if (!cleanCode) {
    return {
      success: false,
      status: 'error',
      message: 'Código QR no válido',
      qrCode: cleanCode,
      lote,
    };
  }

  // 1. Verificación local rápida si ya está encolada en SQLite
  if (isPalmetaPending(cleanCode)) {
    return {
      success: false,
      status: 'duplicate',
      isDuplicate: true,
      message: 'Palmeta ya registrada (pendiente de sincronización)',
      qrCode: cleanCode,
      lote,
    };
  }

  const codigoVisible = deriveCodigoVisible(cleanCode);

  // 2. Intentar inserción directa en Supabase
  try {
    const { data, error } = await supabase
      .from('palmetas_led')
      .insert({
        codigo_qr: cleanCode,
        qr_uuid: cleanCode,
        codigo_visible: codigoVisible,
        estado: 'operativo',
        lote_ingreso: lote,
        lote_fabricacion: lote,
        ubicacion_actual: 'bodega_central',
      })
      .select('id, codigo_qr, qr_uuid, codigo_visible, estado, lote_ingreso')
      .single();

    if (!error) {
      return {
        success: true,
        status: 'cloud_created',
        message: 'Palmeta registrada en Supabase',
        qrCode: cleanCode,
        lote,
      };
    }

    // 3. Manejo de error de duplicado en PostgreSQL (código 23505 o mensaje unique constraint)
    const errorMsg = error.message?.toLowerCase() || '';
    const isPostgresDuplicate =
      error.code === '23505' ||
      errorMsg.includes('duplicate') ||
      errorMsg.includes('already exists') ||
      errorMsg.includes('unique constraint') ||
      errorMsg.includes('qr_uuid_key') ||
      errorMsg.includes('codigo_qr');

    if (isPostgresDuplicate) {
      return {
        success: false,
        status: 'duplicate',
        isDuplicate: true,
        message: 'Palmeta ya registrada',
        qrCode: cleanCode,
        lote,
      };
    }

    // 4. Si el error es por falta de conexión o red, recurrir a SQLite
    console.warn('Supabase no disponible o error temporal, guardando offline:', error.message);
    return fallbackToOffline(cleanCode, lote);
  } catch (networkError: any) {
    // 5. Excepción de red (sin conexión a internet / DNS / Timeout)
    console.warn('Excepción de red al contactar Supabase, guardando en SQLite:', networkError?.message);
    return fallbackToOffline(cleanCode, lote);
  }
};

/**
 * Respalda el registro en la tabla SQLite palmetas_pendientes
 */
const fallbackToOffline = (qrCode: string, lote: string): ProvisionResult => {
  try {
    const localResult = insertPendingPalmeta(qrCode, lote, 'operativo');

    if (localResult.isDuplicate) {
      return {
        success: false,
        status: 'duplicate',
        isDuplicate: true,
        message: 'Palmeta ya registrada',
        qrCode,
        lote,
      };
    }

    return {
      success: true,
      status: 'offline_queued',
      message: 'Guardada localmente en SQLite (sin internet)',
      qrCode,
      lote,
    };
  } catch (dbError: any) {
    console.error('Error guardando palmeta en SQLite:', dbError);
    return {
      success: false,
      status: 'error',
      message: 'No fue posible registrar la palmeta',
      qrCode,
      lote,
    };
  }
};

export interface InventoryMetrics {
  totalPalmetas: number;
  totalM2: number;
  operativoCount: number;
  operativoM2: number;
  operativoPercentage: number;
  mantencionCount: number;
  mantencionM2: number;
  bajaCount: number;
  bajaM2: number;
}

/**
 * Convierte cantidad de palmetas a metros cuadrados (1 palmeta = 0.25 m² / 50x50cm)
 */
export const palmetasToM2 = (count: number): number => {
  return Number((count * 0.25).toFixed(2));
};

/**
 * Formatea metros cuadrados (ej: "25 m²" o "32.5 m²")
 */
export const formatM2 = (m2: number): string => {
  if (m2 === 0) return '0 m²';
  return Number.isInteger(m2) ? `${m2} m²` : `${m2.toFixed(2).replace(/\.?0+$/, '')} m²`;
};

export const getEmptyInventoryMetrics = (): InventoryMetrics => ({
  totalPalmetas: 0,
  totalM2: 0,
  operativoCount: 0,
  operativoM2: 0,
  operativoPercentage: 0,
  mantencionCount: 0,
  mantencionM2: 0,
  bajaCount: 0,
  bajaM2: 0,
});

/**
 * Consulta en Supabase la tabla 'palmetas_led' agrupada por estado ('operativo', 'mantencion', 'baja')
 * y calcula áreas dinámicamente con el estándar 1 palmeta = 0.25 m².
 */
export const fetchInventoryMetrics = async (): Promise<InventoryMetrics> => {
  try {
    const { data, error } = await supabase
      .from('palmetas_led')
      .select('estado');

    if (error) {
      console.warn('Error consultando palmetas en Supabase, retornando ceros:', error.message);
      return getEmptyInventoryMetrics();
    }

    let op = 0;
    let mant = 0;
    let baja = 0;

    (data || []).forEach((row: { estado?: string }) => {
      const st = row.estado?.toLowerCase() || '';
      if (st === 'operativo') {
        op++;
      } else if (st === 'mantencion' || st === 'reparacion') {
        mant++;
      } else if (st === 'baja') {
        baja++;
      }
    });

    const total = op + mant + baja;
    const percentage = total > 0 ? (op / total) * 100 : 0;

    return {
      totalPalmetas: total,
      totalM2: palmetasToM2(total),
      operativoCount: op,
      operativoM2: palmetasToM2(op),
      operativoPercentage: percentage,
      mantencionCount: mant,
      mantencionM2: palmetasToM2(mant),
      bajaCount: baja,
      bajaM2: palmetasToM2(baja),
    };
  } catch (err: any) {
    console.warn('Excepción obteniendo métricas de inventario:', err?.message);
    return getEmptyInventoryMetrics();
  }
};



/**
 * Mutación Online-First con Offline-Fallback para "Dar de Baja" un activo (palmeta LED).
 * 1. Intenta actualizar directamente en Supabase (palmetas_led -> 'baja' e inserción en incidencias).
 * 2. Si la petición de red falla (fetch failed, Network request failed, timeout o modo offline),
 *    el bloque catch encola la baja en la base de datos local SQLite (incidencias_locales).
 * 3. No usa NetInfo para bloquear la petición; lanza directamente la llamada asíncrona a Supabase.
 */
export const decommissionPalmeta = async (
  qrUuid: string,
  motivo: string = 'Baja confirmada por técnico en terreno',
  eventoIdOrNombre: string = 'Festival Estadio Nacional'
): Promise<DecommissionResult> => {
  const cleanCode = qrUuid.trim();
  if (!cleanCode) {
    throw new Error('Código QR no válido');
  }

  // 1. Intento Online-First directo a Supabase
  try {
    let tecnicoId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      tecnicoId = userData?.user?.id ?? null;
    } catch {
      // Ignorar si no hay sesión
    }

    // Resolver evento si existe en Supabase
    let eventoUuid: string | null = null;
    try {
      const { data: evData } = await supabase
        .from('eventos')
        .select('id')
        .eq('nombre', eventoIdOrNombre)
        .limit(1);
      if (evData && evData.length > 0) {
        eventoUuid = evData[0].id;
      }
    } catch {
      // noop
    }

    // Resolver ID de palmeta en Supabase si ya existe registrada
    let palmetaId: string | null = null;
    try {
      const { data: pData } = await supabase
        .from('palmetas_led')
        .select('id')
        .or(`codigo_qr.eq.${cleanCode},qr_uuid.eq.${cleanCode},codigo_visible.eq.${cleanCode}`)
        .limit(1);
      if (pData && pData.length > 0) {
        palmetaId = pData[0].id;
      }
    } catch {
      // noop
    }

    // A) Actualizar estado en Supabase palmetas_led a 'baja'
    const updateQuery = supabase
      .from('palmetas_led')
      .update({
        estado: 'baja',
        ubicacion_actual: 'desecho',
        updated_at: new Date().toISOString(),
      });

    const { error: updateError } = palmetaId
      ? await updateQuery.eq('id', palmetaId)
      : await updateQuery.or(`codigo_qr.eq.${cleanCode},qr_uuid.eq.${cleanCode}`);

    if (updateError) {
      throw updateError;
    }

    // B) Registrar incidencia de baja en Supabase en tiempo real
    const { error: incidentError } = await supabase
      .from('incidencias')
      .insert({
        qr_uuid: cleanCode,
        palmeta_id: palmetaId,
        evento_id: eventoUuid,
        tecnico_id: tecnicoId,
        tipo_falla: 'Falla Crítica - Dado de Baja',
        descripcion: motivo,
        fecha_ocurrencia: new Date().toISOString(),
        resuelto: false,
      });

    if (incidentError) {
      console.warn('Aviso registrando incidencia en Supabase tras baja:', incidentError.message);
    }

    return {
      success: true,
      mode: 'cloud',
      message: 'Módulo dado de baja en tiempo real en la nube.',
    };
  } catch (networkError: any) {
    console.warn('[Online-First] Falló actualización en Supabase, aplicando Offline-Fallback:', networkError?.message);

    // 2. Offline-Fallback (Catch & Queue en SQLite)
    try {
      insertLocalIncidencia(
        cleanCode,
        'Falla Crítica - Dado de Baja',
        undefined,
        motivo,
        eventoIdOrNombre
      );

      return {
        success: true,
        mode: 'offline',
        message: 'Guardado localmente. Se sincronizará cuando haya conexión.',
      };
    } catch (localDbError: any) {
      console.error('Error guardando baja en SQLite local:', localDbError);
      throw new Error('No se pudo guardar la baja en el almacenamiento local.');
    }
  }
};
