import * as SQLite from 'expo-sqlite';

// Inicializa la conexión de manera síncrona (SDK 51+)
const db = SQLite.openDatabaseSync('aleprod_local.db');

export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS incidencias_locales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_uuid TEXT NOT NULL,
        fecha TEXT NOT NULL
      );
    `);
    console.log("Base de datos y tabla 'incidencias_locales' inicializadas.");
  } catch (error) {
    console.error("Error inicializando la base de datos:", error);
  }
};

export const insertIncidencia = (qrUuid: string) => {
  try {
    const fecha = new Date().toISOString();
    // Inserción usando parámetros para evitar SQL injection
    const result = db.runSync(
      'INSERT INTO incidencias_locales (qr_uuid, fecha) VALUES (?, ?)', 
      [qrUuid, fecha]
    );
    console.log("Registro guardado con éxito. ID:", result.lastInsertRowId);
    return true;
  } catch (error) {
    console.error("Error al insertar incidencia:", error);
    throw error;
  }
};
