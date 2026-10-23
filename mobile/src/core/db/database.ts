import * as SQLite from 'expo-sqlite';

// Inicializa la conexión de manera síncrona (SDK 51+)
export const db = SQLite.openDatabaseSync('aleprod_local.db');

export interface LocalIncidencia {
  id: number;
  qr_uuid: string;
  fecha: string;
  tipo_falla?: string;
  foto_uri?: string;
  observaciones?: string;
  evento_id?: string;
  sincronizado: number;
  sincronizado_at?: string;
}

export interface LocalEvento {
  id: string;
  nombre: string;
  locacion: string;
  fecha_inicio: string;
  fecha_termino?: string;
  estado: 'en_curso' | 'finalizado' | 'planificado';
  metros_cuadrados?: number;
  tipo_pantalla?: string;
  tecnico_id?: string;
}

export interface LocalPalmetaPendiente {
  id: number;
  qr_uuid: string;
  estado: string;
  lote_ingreso: string;
  fecha: string;
  sincronizado: number;
  sincronizado_at?: string;
}

export const initDB = () => {
  try {
    // 1. Tabla de incidencias locales
    db.execSync(`
      CREATE TABLE IF NOT EXISTS incidencias_locales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_uuid TEXT NOT NULL,
        fecha TEXT NOT NULL,
        tipo_falla TEXT DEFAULT 'Escaneo Operativo',
        foto_uri TEXT,
        observaciones TEXT,
        evento_id TEXT DEFAULT 'Festival Estadio Nacional',
        sincronizado INTEGER DEFAULT 0,
        sincronizado_at TEXT
      );
    `);

    // Migraciones automáticas para incidencias_locales
    const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(incidencias_locales)');
    const colNames = columns.map((c) => c.name);

    if (!colNames.includes('sincronizado')) {
      db.execSync('ALTER TABLE incidencias_locales ADD COLUMN sincronizado INTEGER DEFAULT 0;');
    }
    if (!colNames.includes('tipo_falla')) {
      db.execSync("ALTER TABLE incidencias_locales ADD COLUMN tipo_falla TEXT DEFAULT 'Escaneo Operativo';");
    }
    if (!colNames.includes('foto_uri')) {
      db.execSync('ALTER TABLE incidencias_locales ADD COLUMN foto_uri TEXT;');
    }
    if (!colNames.includes('observaciones')) {
      db.execSync('ALTER TABLE incidencias_locales ADD COLUMN observaciones TEXT;');
    }
    if (!colNames.includes('evento_id')) {
      db.execSync("ALTER TABLE incidencias_locales ADD COLUMN evento_id TEXT DEFAULT 'Festival Estadio Nacional';");
    }
    if (!colNames.includes('sincronizado_at')) {
      db.execSync('ALTER TABLE incidencias_locales ADD COLUMN sincronizado_at TEXT;');
    }

    // 2. Tabla de eventos locales para resiliencia offline (HU-16)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS eventos_locales (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        locacion TEXT NOT NULL,
        fecha_inicio TEXT NOT NULL,
        fecha_termino TEXT,
        estado TEXT NOT NULL DEFAULT 'en_curso',
        metros_cuadrados REAL DEFAULT 0,
        tipo_pantalla TEXT,
        tecnico_id TEXT
      );
    `);

    // 3. Tabla de palmetas pendientes para modo ráfaga offline (HU-13)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS palmetas_pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_uuid TEXT NOT NULL UNIQUE,
        estado TEXT NOT NULL DEFAULT 'operativo',
        lote_ingreso TEXT NOT NULL,
        fecha TEXT NOT NULL,
        sincronizado INTEGER DEFAULT 0,
        sincronizado_at TEXT
      );
    `);

    // 4. Tabla meta para migraciones internas
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meta_app (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Reset garantizado para iniciar limpio (0 incidencias registradas de prueba)
    const resetDone = db.getFirstSync<{ key: string }>(
      "SELECT key FROM meta_app WHERE key = 'clean_initial_incidents_v2'"
    );
    if (!resetDone) {
      db.execSync('DELETE FROM incidencias_locales;');
      db.execSync('DELETE FROM palmetas_pendientes;');
      db.runSync(
        "INSERT OR REPLACE INTO meta_app (key, value) VALUES ('clean_initial_incidents_v2', 'done')"
      );
      console.log("Limpieza inicial ejecutada: incidencias locales reseteadas a 0.");
    }

    // Reset de eventos mockeados o no iniciados para reflejar estado real (0 eventos activos arbitrarios)
    const eventsResetDone = db.getFirstSync<{ key: string }>(
      "SELECT key FROM meta_app WHERE key = 'clean_mock_active_events_v2'"
    );
    if (!eventsResetDone) {
      db.execSync("UPDATE eventos_locales SET estado = 'planificado' WHERE estado = 'en_curso';");
      db.runSync(
        "INSERT OR REPLACE INTO meta_app (key, value) VALUES ('clean_mock_active_events_v2', 'done')"
      );
      console.log("Limpieza de eventos ejecutada: eventos activos reseteados a planificados.");
    }

    console.log("Tablas 'incidencias_locales', 'eventos_locales' y 'palmetas_pendientes' sincronizadas.");
  } catch (error) {
    console.error("Error inicializando la base de datos:", error);
  }
};

export const insertIncidencia = (
  qrUuid: string,
  tipoFalla: string = 'Escaneo Operativo',
  fotoUri?: string,
  observaciones?: string,
  eventoId: string = 'Festival Estadio Nacional'
) => {
  try {
    const fecha = new Date().toISOString();
    const result = db.runSync(
      'INSERT INTO incidencias_locales (qr_uuid, fecha, tipo_falla, foto_uri, observaciones, evento_id, sincronizado) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [qrUuid, fecha, tipoFalla, fotoUri ?? null, observaciones ?? null, eventoId]
    );
    console.log("Registro guardado con éxito. ID:", result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error al insertar incidencia:", error);
    throw error;
  }
};

// Alias para compatibilidad con HU-11
export const insertLocalIncidencia = insertIncidencia;

/**
 * Retorna el COUNT(*) de incidencias_locales donde sincronizado = 0
 */
export const getPendingSyncCount = (): number => {
  try {
    const row = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM incidencias_locales WHERE sincronizado = 0'
    );
    return row?.count ?? 0;
  } catch (error) {
    console.error("Error obteniendo conteo de sincronización:", error);
    return 0;
  }
};

/**
 * Retorna los últimos registros insertados ordenados por id/fecha DESC
 */
export const getRecentActivity = (limit: number = 5): LocalIncidencia[] => {
  try {
    const rows = db.getAllSync<LocalIncidencia>(
      'SELECT * FROM incidencias_locales ORDER BY id DESC LIMIT ?',
      [limit]
    );
    return rows;
  } catch (error) {
    console.error("Error obteniendo actividad reciente:", error);
    return [];
  }
};

/**
 * Retorna las incidencias registradas para un UUID específico de palmeta
 */
export const getIncidenciasByUuid = (qrUuid: string): LocalIncidencia[] => {
  try {
    const rows = db.getAllSync<LocalIncidencia>(
      'SELECT * FROM incidencias_locales WHERE qr_uuid = ? ORDER BY id DESC',
      [qrUuid]
    );
    return rows;
  } catch (error) {
    console.error("Error obteniendo incidencias por UUID:", error);
    return [];
  }
};

/**
 * HU-16: Retorna las incidencias locales vinculadas a un evento (por UUID o nombre)
 */
export const getLocalIncidenciasByEvento = (eventoIdOrName: string): LocalIncidencia[] => {
  try {
    const rows = db.getAllSync<LocalIncidencia>(
      'SELECT * FROM incidencias_locales WHERE evento_id = ? OR evento_id LIKE ? ORDER BY id DESC',
      [eventoIdOrName, `%${eventoIdOrName}%`]
    );
    return rows;
  } catch (error) {
    console.error("Error obteniendo incidencias locales por evento:", error);
    return [];
  }
};

/**
 * Retorna todas las incidencias locales registradas en SQLite
 */
export const getAllLocalIncidencias = (): LocalIncidencia[] => {
  try {
    const rows = db.getAllSync<LocalIncidencia>(
      'SELECT * FROM incidencias_locales ORDER BY id DESC'
    );
    return rows;
  } catch (error) {
    console.error("Error obteniendo todas las incidencias locales:", error);
    return [];
  }
};

/**
 * Retorna todos los eventos registrados en la caché SQLite local
 */
export const getAllLocalEventos = (): LocalEvento[] => {
  try {
    const rows = db.getAllSync<LocalEvento>(
      'SELECT * FROM eventos_locales ORDER BY fecha_inicio DESC'
    );
    return rows;
  } catch (error) {
    console.error("Error obteniendo eventos locales:", error);
    return [];
  }
};



/**
 * HU-16: Actualiza el estado de un evento local (ej. a 'finalizado')
 */
export const updateLocalEventoEstado = (
  idOrNombre: string,
  nuevoEstado: 'en_curso' | 'finalizado'
): boolean => {
  try {
    const fechaTermino = nuevoEstado === 'finalizado' ? new Date().toISOString() : null;
    db.runSync(
      'UPDATE eventos_locales SET estado = ?, fecha_termino = ? WHERE id = ? OR nombre = ?',
      [nuevoEstado, fechaTermino, idOrNombre, idOrNombre]
    );
    return true;
  } catch (error) {
    console.warn("Error actualizando estado de evento local:", error);
    return false;
  }
};

/**
 * HU-10: Retorna el evento activo local más reciente (estado = 'en_curso')
 */
export const getActiveLocalEvento = (): LocalEvento | null => {
  try {
    const row = db.getFirstSync<LocalEvento>(
      "SELECT * FROM eventos_locales WHERE estado = 'en_curso' ORDER BY fecha_inicio DESC LIMIT 1"
    );
    return row ?? null;
  } catch (error) {
    console.warn("Error obteniendo evento activo local:", error);
    return null;
  }
};

/**
 * HU-10: Guarda o actualiza un evento local para caché offline
 */
export const upsertLocalEvento = (evento: LocalEvento): void => {
  try {
    db.runSync(
      `INSERT OR REPLACE INTO eventos_locales 
        (id, nombre, locacion, fecha_inicio, fecha_termino, estado, metros_cuadrados, tipo_pantalla, tecnico_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evento.id,
        evento.nombre,
        evento.locacion,
        evento.fecha_inicio,
        evento.fecha_termino ?? null,
        evento.estado,
        evento.metros_cuadrados ?? 0,
        evento.tipo_pantalla ?? null,
        evento.tecnico_id ?? null,
      ]
    );
  } catch (error) {
    console.warn("Error guardando evento local:", error);
  }
};

/**
 * HU-14: Retorna todas las incidencias pendientes de sincronizar (sincronizado = 0)
 */
export const getPendingIncidencias = (): LocalIncidencia[] => {
  try {
    const rows = db.getAllSync<LocalIncidencia>(
      'SELECT * FROM incidencias_locales WHERE sincronizado = 0 ORDER BY id ASC'
    );
    return rows;
  } catch (error) {
    console.error("Error obteniendo incidencias pendientes:", error);
    return [];
  }
};

/**
 * HU-14: Marca una incidencia local específica como sincronizada y actualiza su foto remota si aplica
 */
export const markIncidenciaAsSynced = (
  id: number,
  remoteFotoUrl?: string
): boolean => {
  try {
    const fecha = new Date().toISOString();
    if (remoteFotoUrl) {
      db.runSync(
        'UPDATE incidencias_locales SET sincronizado = 1, sincronizado_at = ?, foto_uri = ? WHERE id = ?',
        [fecha, remoteFotoUrl, id]
      );
    } else {
      db.runSync(
        'UPDATE incidencias_locales SET sincronizado = 1, sincronizado_at = ? WHERE id = ?',
        [fecha, id]
      );
    }
    return true;
  } catch (error) {
    console.error(`Error marcando incidencia ${id} como sincronizada:`, error);
    return false;
  }
};

/**
 * Marca todos los registros locales pendientes como sincronizados
 */
export const markAllAsSynced = (): number => {
  try {
    const fecha = new Date().toISOString();
    const result = db.runSync(
      'UPDATE incidencias_locales SET sincronizado = 1, sincronizado_at = ? WHERE sincronizado = 0',
      [fecha]
    );
    console.log(`Registros sincronizados: ${result.changes}`);
    return result.changes;
  } catch (error) {
    console.error("Error marcando registros como sincronizados:", error);
    return 0;
  }
};

/**
 * Marca un conjunto de IDs locales específicos como sincronizados
 */
export const markIncidenciasAsSyncedByIds = (ids: number[]): number => {
  if (ids.length === 0) return 0;
  try {
    const fecha = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    const result = db.runSync(
      `UPDATE incidencias_locales SET sincronizado = 1, sincronizado_at = ? WHERE id IN (${placeholders})`,
      [fecha, ...ids]
    );
    return result.changes;
  } catch (error) {
    console.error("Error marcando IDs como sincronizados:", error);
    return 0;
  }
};

/**
 * HU-13: Inserta una palmeta en la cola local de pendientes cuando no hay conexión
 * Maneja duplicados locales automáticamente vía constraint UNIQUE
 */
export const insertPendingPalmeta = (
  qrUuid: string,
  loteIngreso: string,
  estado: string = 'operativo'
): { success: boolean; isDuplicate: boolean; id?: number } => {
  try {
    // 1. Verificación previa por código
    const existing = db.getFirstSync<{ id: number; sincronizado: number }>(
      'SELECT id, sincronizado FROM palmetas_pendientes WHERE qr_uuid = ? LIMIT 1',
      [qrUuid]
    );

    if (existing) {
      return { success: false, isDuplicate: true, id: existing.id };
    }

    // 2. Inserción parametrizada con API síncrona moderna de Expo SQLite
    const fecha = new Date().toISOString();
    const result = db.runSync(
      'INSERT INTO palmetas_pendientes (qr_uuid, estado, lote_ingreso, fecha, sincronizado) VALUES (?, ?, ?, ?, 0)',
      [qrUuid, estado, loteIngreso, fecha]
    );

    return { success: true, isDuplicate: false, id: result.lastInsertRowId };
  } catch (error: any) {
    if (error?.message && (error.message.includes('UNIQUE constraint failed') || error.message.includes('code 2067'))) {
      return { success: false, isDuplicate: true };
    }
    console.error('Error insertando palmeta pendiente:', error);
    throw error;
  }
};

/**
 * HU-13: Retorna el número de palmetas pendientes de sincronizar
 */
export const getPendingPalmetasCount = (): number => {
  try {
    const row = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM palmetas_pendientes WHERE sincronizado = 0'
    );
    return row?.count ?? 0;
  } catch (error) {
    console.error('Error obteniendo conteo de palmetas pendientes:', error);
    return 0;
  }
};

/**
 * HU-13: Retorna todas las palmetas pendientes para el motor de sincronización
 */
export const getPendingPalmetas = (): LocalPalmetaPendiente[] => {
  try {
    const rows = db.getAllSync<LocalPalmetaPendiente>(
      'SELECT * FROM palmetas_pendientes WHERE sincronizado = 0 ORDER BY id ASC'
    );
    return rows;
  } catch (error) {
    console.error('Error obteniendo palmetas pendientes:', error);
    return [];
  }
};

/**
 * HU-13: Marca una palmeta local pendiente como sincronizada con la nube
 */
export const markPalmetaAsSynced = (id: number): boolean => {
  try {
    const fecha = new Date().toISOString();
    db.runSync(
      'UPDATE palmetas_pendientes SET sincronizado = 1, sincronizado_at = ? WHERE id = ?',
      [fecha, id]
    );
    return true;
  } catch (error) {
    console.error(`Error marcando palmeta ${id} como sincronizada:`, error);
    return false;
  }
};

/**
 * HU-13: Verifica si una palmeta ya está en cola local de pendientes
 */
export const isPalmetaPending = (qrUuid: string): boolean => {
  try {
    const row = db.getFirstSync<{ id: number }>(
      'SELECT id FROM palmetas_pendientes WHERE qr_uuid = ? LIMIT 1',
      [qrUuid]
    );
    return !!row;
  } catch {
    return false;
  }
};

/**
 * Conteo total de pendientes (incidencias + palmetas masivas)
 */
export const getTotalPendingSyncCount = (): number => {
  return getPendingSyncCount() + getPendingPalmetasCount();
};

/**
 * Limpia todas las incidencias locales registradas en SQLite
 */
export const clearAllLocalIncidencias = (): void => {
  try {
    db.execSync('DELETE FROM incidencias_locales;');
    console.log("Todas las incidencias locales han sido eliminadas.");
  } catch (error) {
    console.error("Error al limpiar incidencias locales:", error);
  }
};

/**
 * Limpia todas las palmetas pendientes locales de SQLite
 */
export const clearAllPendingPalmetas = (): void => {
  try {
    db.execSync('DELETE FROM palmetas_pendientes;');
    console.log("Todas las palmetas pendientes han sido eliminadas.");
  } catch (error) {
    console.error("Error al limpiar palmetas pendientes:", error);
  }
};

/**
 * Resetea eventos activos locales a estado planificado
 */
export const clearAllLocalActiveEvents = (): void => {
  try {
    db.execSync("UPDATE eventos_locales SET estado = 'planificado' WHERE estado = 'en_curso';");
    console.log("Eventos locales activos reiniciados a planificados.");
  } catch (error) {
    console.error("Error al reiniciar eventos activos locales:", error);
  }
};
