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

  // 2. Intentar inserción directa en Supabase
  try {
    const { data, error } = await supabase
      .from('palmetas_led')
      .insert({
        codigo_qr: cleanCode,
        qr_uuid: cleanCode,
        estado: 'operativo',
        lote_ingreso: lote,
        lote_fabricacion: lote,
        ubicacion_actual: 'bodega_central',
      })
      .select('id, codigo_qr, qr_uuid, estado, lote_ingreso')
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
