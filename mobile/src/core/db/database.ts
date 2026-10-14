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

export const initDB = () => {
  try {
    // Creación inicial con esquema extendido
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

    // Migraciones automáticas seguras para columnas añadidas
    const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(incidencias_locales)');
    const colNames = columns.map(c => c.name);

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

    console.log("Base de datos y tabla 'incidencias_locales' inicializadas/migradas.");
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
 * Retorna las incidencias registradas para un UUID específico
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
