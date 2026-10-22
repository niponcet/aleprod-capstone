import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import {
  getPendingIncidencias,
  markIncidenciaAsSynced,
  LocalIncidencia,
  getPendingPalmetas,
  markPalmetaAsSynced,
  LocalPalmetaPendiente,
} from '../db/database';

export interface SyncResult {
  totalPending: number;
  syncedCount: number;
  failedCount: number;
  photosUploaded: number;
  palmetasSynced?: number;
  errors: string[];
}

export interface PalmetaSyncResult {
  totalPending: number;
  syncedCount: number;
  duplicateCount: number;
  failedCount: number;
  errors: string[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * HU-12: Sube una imagen de evidencia fotográfica local a Supabase Storage
 * Bucket: evidencias-incidencias
 * @param localUri URI local del dispositivo (file:// o similar)
 * @returns URL pública del archivo en Supabase Storage, o null si falla
 */
export const uploadEvidenceImage = async (localUri: string): Promise<string | null> => {
  if (!localUri) return null;

  // Si ya es una URL remota de Supabase / HTTP, no requiere re-subida
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return localUri;
  }

  try {
    // 1. Determinar extensión y MIME type
    const cleanUri = localUri.split('?')[0];
    const extension = cleanUri.split('.').pop()?.toLowerCase() || 'jpg';
    let mimeType = 'image/jpeg';
    if (extension === 'png') mimeType = 'image/png';
    else if (extension === 'webp') mimeType = 'image/webp';

    // 2. Leer archivo local en formato Base64 con expo-file-system
    const base64Data = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64Data) {
      console.warn('El archivo local de foto está vacío:', localUri);
      return null;
    }

    // 3. Decodificar Base64 a ArrayBuffer para Supabase Storage
    const arrayBuffer = decode(base64Data);

    // 4. Generar ruta única de archivo
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 9);
    const fileName = `evidencia-${timestamp}-${randomHex}.${extension}`;
    const filePath = `reportes/${fileName}`;

    // 5. Subir a Supabase Storage bucket 'evidencias-incidencias'
    const { error: uploadError } = await supabase.storage
      .from('evidencias-incidencias')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.warn('Error subiendo imagen a Supabase Storage:', uploadError.message);
      return null;
    }

    // 6. Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('evidencias-incidencias')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.warn('Excepción al procesar imagen para Storage:', error);
    return null;
  }
};

/**
 * Resuelve el UUID de un evento a partir de su ID local o su nombre en Supabase
 */
export const resolveEventoUuid = async (eventoIdentifier?: string): Promise<string | null> => {
  if (!eventoIdentifier) return null;

  // Si ya es un UUID válido
  if (UUID_REGEX.test(eventoIdentifier)) {
    return eventoIdentifier;
  }

  try {
    // Buscar por nombre de evento en Supabase
    const { data, error } = await supabase
      .from('eventos')
      .select('id')
      .eq('nombre', eventoIdentifier)
      .limit(1);

    if (!error && data && data.length > 0) {
      return data[0].id;
    }

    // Si era un identificador temporal como 'ev-1', intentar con el evento activo de turno
    const { data: activeData } = await supabase
      .from('eventos')
      .select('id')
      .eq('estado', 'en_curso')
      .order('fecha_inicio', { ascending: false })
      .limit(1);

    if (activeData && activeData.length > 0) {
      return activeData[0].id;
    }
  } catch (err) {
    console.warn('No se pudo resolver UUID del evento:', err);
  }

  return null;
};

/**
 * Resuelve el UUID de la palmeta en Supabase si ya se encuentra registrada en el inventario maestro
 */
export const resolvePalmetaUuid = async (qrUuid: string): Promise<string | null> => {
  if (!qrUuid) return null;

  try {
    // 1. Si qrUuid es directamente un UUID de palmetas_led
    if (UUID_REGEX.test(qrUuid)) {
      const { data } = await supabase
        .from('palmetas_led')
        .select('id')
        .eq('id', qrUuid)
        .limit(1);

      if (data && data.length > 0) {
        return data[0].id;
      }
    }

    // 2. Si qrUuid es el serial físico o código QR escaneado
    const { data, error } = await supabase
      .from('palmetas_led')
      .select('id')
      .eq('numero_serie', qrUuid)
      .limit(1);

    if (!error && data && data.length > 0) {
      return data[0].id;
    }
  } catch (err) {
    console.warn('Error resolviendo palmeta_id remoto:', err);
  }

  return null;
};

/**
 * HU-14: Motor de Sincronización Real (Offline -> Cloud)
 * Procesa todas las incidencias locales pendientes:
 * 1. Sube fotografías al bucket evidencias-incidencias
 * 2. Mapea e inserta registros en public.incidencias de Supabase
 * 3. Actualiza el flag local sincronizado = 1 en SQLite solo tras confirmación
 */
export const syncPendingIncidencias = async (): Promise<SyncResult> => {
  const pendingRows: LocalIncidencia[] = getPendingIncidencias();

  const result: SyncResult = {
    totalPending: pendingRows.length,
    syncedCount: 0,
    failedCount: 0,
    photosUploaded: 0,
    errors: [],
  };

  if (pendingRows.length === 0) {
    return result;
  }

  // Obtener sesión del usuario autenticado para asignar tecnico_id
  let tecnicoId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    tecnicoId = data?.user?.id ?? null;
  } catch {
    console.warn('No se pudo obtener usuario autenticado para la sincronización.');
  }

  for (const item of pendingRows) {
    try {
      let remoteFotoUrl: string | null = null;

      // 1. Si tiene foto local, subirla primero al Storage (HU-12)
      if (item.foto_uri) {
        const uploadedUrl = await uploadEvidenceImage(item.foto_uri);
        if (uploadedUrl) {
          remoteFotoUrl = uploadedUrl;
          result.photosUploaded++;
        } else {
          // Si falló la subida de foto pero es una URL previa, conservarla
          if (item.foto_uri.startsWith('http')) {
            remoteFotoUrl = item.foto_uri;
          }
        }
      }

      // 2. Resolver foreign keys relacionales seguras
      const eventoUuid = await resolveEventoUuid(item.evento_id);
      const palmetaUuid = await resolvePalmetaUuid(item.qr_uuid);

      // 3. Ejecutar INSERT real en la tabla incidencias de Supabase (HU-14)
      const { error: insertError } = await supabase
        .from('incidencias')
        .insert({
          qr_uuid: item.qr_uuid,
          palmeta_id: palmetaUuid,
          evento_id: eventoUuid,
          tecnico_id: tecnicoId,
          tipo_falla: item.tipo_falla || 'Escaneo Operativo',
          descripcion: item.observaciones || null,
          foto_url: remoteFotoUrl,
          fecha_ocurrencia: item.fecha || new Date().toISOString(),
        });

      if (insertError) {
        console.warn(`Error insertando incidencia local ID ${item.id} en Supabase:`, insertError.message);
        result.failedCount++;
        result.errors.push(`Registro #${item.id}: ${insertError.message}`);
        // Continúa con el siguiente sin marcar este como sincronizado
        continue;
      }

      // 4. Solo si el INSERT remoto fue exitoso, marcar en SQLite como sincronizado
      markIncidenciaAsSynced(item.id, remoteFotoUrl || undefined);
      result.syncedCount++;
    } catch (err: any) {
      console.error(`Excepción sincronizando incidencia ID ${item.id}:`, err);
      result.failedCount++;
      result.errors.push(err?.message || 'Error desconocido de red');
    }
  }

  return result;
};

/**
 * HU-13: Sincroniza las palmetas aprovisionadas en modo ráfaga que quedaron pendientes en SQLite
 */
export const syncPendingPalmetas = async (): Promise<PalmetaSyncResult> => {
  const pendingRows: LocalPalmetaPendiente[] = getPendingPalmetas();

  const result: PalmetaSyncResult = {
    totalPending: pendingRows.length,
    syncedCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (pendingRows.length === 0) {
    return result;
  }

  for (const item of pendingRows) {
    try {
      const { error } = await supabase
        .from('palmetas_led')
        .insert({
          codigo_qr: item.qr_uuid,
          qr_uuid: item.qr_uuid,
          estado: item.estado || 'operativo',
          lote_ingreso: item.lote_ingreso,
          lote_fabricacion: item.lote_ingreso,
          ubicacion_actual: 'bodega_central',
        });

      if (!error) {
        markPalmetaAsSynced(item.id);
        result.syncedCount++;
      } else {
        const errorMsg = error.message?.toLowerCase() || '';
        const isDuplicate =
          error.code === '23505' ||
          errorMsg.includes('duplicate') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('unique constraint');

        if (isDuplicate) {
          // Si ya existía en la nube, marcamos como sincronizada para liberar la cola
          markPalmetaAsSynced(item.id);
          result.duplicateCount++;
        } else {
          result.failedCount++;
          result.errors.push(`Palmeta #${item.qr_uuid}: ${error.message}`);
        }
      }
    } catch (err: any) {
      console.error(`Error sincronizando palmeta pendiente ${item.qr_uuid}:`, err);
      result.failedCount++;
      result.errors.push(err?.message || 'Error de red');
    }
  }

  return result;
};

/**
 * Sincronización completa de terreno (Incidencias + Palmetas masivas)
 */
export const syncAllPendingData = async (): Promise<{
  incidencias: SyncResult;
  palmetas: PalmetaSyncResult;
}> => {
  const [incidencias, palmetas] = await Promise.all([
    syncPendingIncidencias(),
    syncPendingPalmetas(),
  ]);

  return { incidencias, palmetas };
};
