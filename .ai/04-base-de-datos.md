# 04 — Arquitectura de Base de Datos y Modelo de Sincronización

> **Alejandra Producciones (aleprod-capstone)**  
> Este documento centraliza la definición técnica de los esquemas de persistencia: la base de datos local SQLite para la operación Offline-First en `/mobile` y el esquema relacional PostgreSQL en Supabase Cloud.

---

## 1. Visión General de la Persistencia

El sistema opera bajo un modelo de datos distribuido:
1. **Edge / Local (Móvil):** SQLite local (`aleprod_local.db`) en el dispositivo del técnico, garantizando lectura/escritura inmediata sin red.
2. **Central Cloud (Backend):** PostgreSQL en Supabase, actuando como fuente de la verdad para el panel web, trazabilidad histórica y consolidación de stock.

---

## 2. Base de Datos Local SQLite (`/mobile`)

- **Motor:** `expo-sqlite` (API Síncrona).
- **Archivo de base de datos:** `aleprod_local.db`.
- **Ubicación en código:** `mobile/src/core/db/database.ts`.

### Tabla Local Activa: `incidencias_locales`
*(Implementada y migrada en el código fuente actual)*

```sql
CREATE TABLE IF NOT EXISTS incidencias_locales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qr_uuid TEXT NOT NULL,
  fecha TEXT NOT NULL,
  tipo_falla TEXT DEFAULT 'Escaneo Operativo',
  foto_uri TEXT,
  evento_id TEXT DEFAULT 'Festival Estadio Nacional',
  sincronizado INTEGER DEFAULT 0,
  sincronizado_at TEXT
);
```

#### Diccionario de Datos:
| Campo | Tipo SQLite | Nulo | Descripción y Regla de Negocio |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NO` | Identificador único local autoincremental (`PRIMARY KEY`). |
| `qr_uuid` | `TEXT` | `NO` | Código UUID o contenido escaneado desde el QR de la palmeta LED. |
| `fecha` | `TEXT` | `NO` | Timestamp en formato ISO 8601 (`new Date().toISOString()`), registrando el momento exacto de la captura en terreno. |
| `tipo_falla` | `TEXT` | `SÍ` | Categoría de la falla reportada (por defecto `'Escaneo Operativo'`). |
| `foto_uri` | `TEXT` | `SÍ` | Ruta local temporal del archivo de imagen de evidencia fotográfica. |
| `evento_id` | `TEXT` | `SÍ` | Nombre o identificador del evento activo de turno (ej: `'Festival Estadio Nacional'`). |
| `sincronizado` | `INTEGER` | `NO` | `0` = Pendiente de subir a Supabase, `1` = Ya sincronizado en la nube. |
| `sincronizado_at`| `TEXT` | `SÍ` | Timestamp ISO del momento en que se completó el push a Supabase. |

#### Funciones de Acceso a Datos Implementadas:
- `initDB()`: Inicializa y ejecuta migraciones seguras automáticas agregando columnas faltantes mediante `PRAGMA table_info`.
- `insertIncidencia(qrUuid: string, tipoFalla?: string)`: Inserción parametrizada con `db.runSync(...)` con `sincronizado = 0`.
- `getPendingSyncCount(): number`: Retorna `COUNT(*)` de incidencias donde `sincronizado = 0`.
- `getRecentActivity(limit = 5): LocalIncidencia[]`: Retorna los últimos registros locales ordenados por `id DESC`.
- `getLocalIncidenciasByEvento(eventoIdOrName: string): LocalIncidencia[]`: Retorna incidencias locales filtradas por ID o nombre de evento.
- `updateLocalEventoEstado(id: string, nuevoEstado: 'en_curso' | 'finalizado'): boolean`: Actualiza el ciclo de vida del evento en SQLite.
- `markAllAsSynced(): number`: Actualiza `sincronizado = 1` y marca `sincronizado_at` con el timestamp actual.

### Tabla Local Activa: `eventos_locales` (HU-16 Resiliencia Offline)
```sql
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
```

---

## 3. Esquema Central PostgreSQL en Supabase Cloud

A continuación se detalla la plantilla estructurada de las tablas del esquema público (`public`), sus relaciones y restricciones de integridad.

```
                           ┌────────────────────────┐
                           │      auth.users        │
                           └───────────┬────────────┘
                                       │ 1:1
                                       ▼
                           ┌────────────────────────┐
                           │        perfiles        │
                           └───────────┬────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │ 1:N (tecnico_id)                            │ 1:N (creado_por)
                ▼                                             ▼
     ┌─────────────────────┐                       ┌─────────────────────┐
     │     incidencias     │◄────────(1:N)─────────┤       eventos       │
     └──────────┬──────────┘                       └─────────────────────┘
                │ N:1                                         ▲
                ▼                                             │
     ┌─────────────────────┐                                  │
     │    palmetas_led     │                                  │
     │(Activo Serializado) │                                  │
     └─────────────────────┘                                  │
                                                              │
     ┌─────────────────────┐        ┌─────────────────────┐   │
     │ repuestos_inventario│◄───────┤  consumo_repuestos  ├───┘
     │(Inventario a Granel)│ (1:N)  │(Descuento de Stock) │ (opcional por evento)
     └─────────────────────┘        └─────────────────────┘
```

### Tabla: `perfiles` (Extensión RBAC de `auth.users`)
```sql
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('tecnico', 'admin')),
  telefono TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Tabla: `eventos` (Contexto de Turno Operativo)
```sql
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  locacion TEXT NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_termino TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'planificado' CHECK (estado IN ('planificado', 'en_curso', 'finalizado')),
  tecnico_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metros_cuadrados NUMERIC DEFAULT 0,
  tipo_pantalla TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```


### Tabla: `palmetas_led` (Activos Serializados con QR)
```sql
CREATE TABLE public.palmetas_led (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_uuid TEXT NOT NULL UNIQUE,
  codigo_visible TEXT NOT NULL UNIQUE,       -- Ej: 'PL-001', 'PL-002'
  lote_fabricacion TEXT,
  estado TEXT NOT NULL DEFAULT 'operativo' CHECK (estado IN ('operativo', 'mantencion', 'reparacion', 'baja')),
  ultima_revision TIMESTAMPTZ,
  ubicacion_actual TEXT DEFAULT 'bodega_central',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Tabla: `incidencias` (Reportes Técnicos desde Móvil)
```sql
CREATE TABLE public.incidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palmeta_id UUID REFERENCES public.palmetas_led(id) ON DELETE RESTRICT,
  qr_uuid TEXT NOT NULL,                     -- Preservado por consistencia offline
  evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  tecnico_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo_falla TEXT NOT NULL,                  -- 'modulo_apagado', 'conector_danado', 'fisura', etc.
  descripcion TEXT,
  foto_url TEXT,                             -- URL en Supabase Storage
  fecha_ocurrencia TIMESTAMPTZ NOT NULL,     -- Timestamp original capturado en SQLite
  resuelto BOOLEAN NOT NULL DEFAULT false,
  solucion_tecnica TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Tabla: `repuestos_inventario` (Inventario a Granel)
```sql
CREATE TABLE public.repuestos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_sku TEXT NOT NULL UNIQUE,           -- Ej: 'MOD-LED-RGB-01'
  nombre TEXT NOT NULL,
  descripcion TEXT,
  stock_actual INTEGER NOT NULL CHECK (stock_actual >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 5,
  unidad_medida TEXT NOT NULL DEFAULT 'unidades', -- 'unidades', 'metros', 'piezas'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Tabla: `consumo_repuestos` (Trazabilidad y Descuento)
```sql
CREATE TABLE public.consumo_repuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incidencia_id UUID REFERENCES public.incidencias(id) ON DELETE CASCADE,
  repuesto_id UUID REFERENCES public.repuestos_inventario(id) ON DELETE RESTRICT,
  cantidad_utilizada INTEGER NOT NULL CHECK (cantidad_utilizada > 0),
  tecnico_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 4. Triggers de Automatización (PostgreSQL)

### Descuento Automático de Stock de Repuestos
Al insertar un consumo en `consumo_repuestos`, un trigger atómico descuenta inmediatamente el stock en `repuestos_inventario`:

```sql
CREATE OR REPLACE FUNCTION public.fn_descontar_stock_repuesto()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.repuestos_inventario
  SET stock_actual = stock_actual - NEW.cantidad_utilizada,
      updated_at = timezone('utc'::text, now())
  WHERE id = NEW.repuesto_id;

  -- Comprobación de seguridad
  IF (SELECT stock_actual FROM public.repuestos_inventario WHERE id = NEW.repuesto_id) < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente para el repuesto solicitado.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_descontar_stock_repuesto
AFTER INSERT ON public.consumo_repuestos
FOR EACH ROW
EXECUTE FUNCTION public.fn_descontar_stock_repuesto();
```

---

## 5. Políticas de Seguridad (Row Level Security - RLS)

> **REGLA ABSOLUTA:** RLS activado en todas las tablas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

1. **Tabla `incidencias`:**
   - **Técnicos (`rol = 'tecnico'`):** Permiso de `INSERT` sobre nuevas incidencias asociadas a su usuario. Permiso de `SELECT` solo sobre incidencias del evento en curso.
   - **Administradores (`rol = 'admin'`):** Permiso total (`ALL`) de lectura, edición y cierre de incidencias.
2. **Tabla `palmetas_led`:**
   - **Técnicos:** Permiso `SELECT` para validar información del QR escaneado.
   - **Administradores:** Permiso `ALL` para dar de alta, editar y gestionar estados.
3. **Tabla `repuestos_inventario`:**
   - **Técnicos:** Solo `SELECT` para verificar stock disponible en taller.
   - **Administradores:** Permiso `ALL` para compras, ajustes y definición de umbrales mínimos.

---

## 6. Protocolo de Sincronización Offline-First (Móvil -> Cloud)

1. **Lote de Sincronización (Batch Push):**  
   Al recuperar la conexión de red, la app selecciona los registros con `sincronizado = 0` ordenados por `id ASC`.
2. **Carga de Evidencia Fotográfica:**  
   Si el registro incluye `foto_uri`, la app primero sube el binario al bucket `evidencias-incidencias` en Supabase Storage y obtiene la URL pública o ruta protegida.
3. **Inserción Remota en Supabase:**  
   Se realiza un `POST` o `insert()` a la tabla `incidencias` enviando:
   - `qr_uuid`: Código de la palmeta.
   - `fecha_ocurrencia`: **El valor exacto de `fecha` guardado en SQLite local** (garantiza orden cronológico real).
   - `tipo_falla`, `foto_url`, etc.
4. **Confirmación Local:**  
   Tras recibir respuesta `201 Created` de Supabase, la app actualiza el registro local:
   ```sql
   UPDATE incidencias_locales
   SET sincronizado = 1, sincronizado_at = ?
   WHERE id = ?;
   ```
5. **Idempotencia:**  
   Si la inserción en Supabase falla por corte de red intermedio, el registro permanece `sincronizado = 0` para reintentarse en el siguiente ciclo sin duplicar registros gracias a claves de unicidad o idempotencia (`UUID` generado en móvil).
