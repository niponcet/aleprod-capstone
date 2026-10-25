import { supabase } from './supabase';
import {
  insertPendingPalmeta,
  isPalmetaPending,
} from '../db/database';

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

