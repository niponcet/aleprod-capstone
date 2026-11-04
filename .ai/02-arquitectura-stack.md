# 02 — Arquitectura del Sistema, Stack Tecnológico y Reglas de Código

> **Alejandra Producciones (aleprod-capstone)**  
> Este documento contiene las restricciones técnicas innegociables para el desarrollo en `/mobile`, `/web` y la infraestructura cloud en Supabase. Todo código generado por agentes de IA debe respetar estas reglas.

---

## 1. Visión General de la Arquitectura

El monorepo está dividido funcionalmente en dos aplicaciones complementarias y un backend como servicio (BaaS):

```
                               ┌────────────────────────────────────────┐
                               │           SUPABASE (Cloud)             │
                               │  PostgreSQL (RLS) + Auth + Storage     │
                               └───────▲────────────────────────▲───────┘
                                       │ (Sync en diferido)     │ (Queries directas / SSR)
                                       │                        │
               ┌───────────────────────┴──────┐          ┌──────┴──────────────────────┐
               │    /mobile (Expo SDK 51+)    │          │     /web (Next.js App)      │
               │   React Native + TypeScript  │          │   TypeScript + Tailwind CSS │
               │   SQLite Local (Síncrono)    │          │   @supabase/ssr (Server/Clt)│
               │   <CameraView> QR Scanner    │          │   Dashboard Administrativo  │
               └──────────────────────────────┘          └─────────────────────────────┘
```

---

## 2. Aplicación Móvil (`/mobile`)

- **Tecnología:** React Native con **Expo (SDK 51+ / Expo ~57)** y TypeScript estricto.
- **Enfoque de Operación:** Offline-First y lectura rápida de códigos QR.

### Regla Estricta: Expo SQLite (API Síncrona Moderna)
> **PROHIBICIÓN TOTAL:** Está terminantemente **PROHIBIDO** el uso de la API antigua asíncrona de Expo SQLite (`SQLite.openDatabase`, transacciones con callbacks `tx.executeSql`). Esa API está deprecada y corrompe el flujo de datos.

* **Patrón Obligatorio:** Usar exclusivamente la **API Síncrona Moderna** (`expo-sqlite`):
  - **Apertura de Base de Datos:**
    ```typescript
    import * as SQLite from 'expo-sqlite';
    export const db = SQLite.openDatabaseSync('aleprod_local.db');
    ```
  - **DDL / Migraciones:** Utilizar `db.execSync(...)`.
  - **Escrituras (INSERT, UPDATE, DELETE):** Utilizar `db.runSync(sql, params)` con parámetros obligatorios para prevenir inyección SQL.
    ```typescript
    const result = db.runSync(
      'INSERT INTO incidencias_locales (qr_uuid, fecha) VALUES (?, ?)',
      [qrUuid, fecha]
    );
    console.log('ID insertado:', result.lastInsertRowId);
    ```
  - **Consultas (SELECT múltiple):** Utilizar `db.getAllSync<T>(sql, params)`.
  - **Consulta (SELECT único):** Utilizar `db.getFirstSync<T>(sql, params)`.

### Regla Estricta: Manejo de Cámara y Escáner QR
> **PROHIBICIÓN TOTAL:** Está prohibido importar o usar el componente deprecado `<Camera>` de versiones antiguas de `expo-camera`.

* **Patrón Obligatorio:**
  - Importar exclusivamente `<CameraView>` y el hook de permisos `useCameraPermissions` desde `expo-camera`:
    ```typescript
    import { CameraView, useCameraPermissions } from 'expo-camera';
    ```
  - Configuración del escaneo: Usar `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}` y enlazar el evento con `onBarcodeScanned`.
  - El manejo de permisos debe ser defensivo y reactivo: chequear `!permission.granted` y proveer botón interactivo para invocar `requestPermission()`.

### Regla Estricta: PWA Móvil en iOS Safari (Status Bar y Viewport Edge-to-Edge)
> **PROHIBICIÓN TOTAL:** Está terminantemente **PROHIBIDO** configurar `apple-mobile-web-app-status-bar-style` como `"black-translucent"` tanto en `mobile/public/index.html` como en `mobile/app.json`.

* **Causa Raíz Verificada Empíricamente:**
  - En WebKit iOS (modo standalone / pantalla de inicio), `black-translucent` sitúa el origen de la vista web en $y=0$ (detrás del Notch / Dynamic Island), pero WebKit calcula `window.innerHeight` restando erróneamente los 47px de la barra de estado superior ($844\text{px} - 47\text{px} = 797\text{px}$).
  - En consecuencia, `#root` con `position: fixed; inset: 0` se ancla al fondo del viewport en $y=797\text{px}$, dejando un espacio muerto de 47px en el borde inferior físico de la pantalla (la "franja inferior"), empujando hacia arriba la barra flotante (`LiquidGlassTabBar`) y descalibrando el scroll.
* **Patrón Obligatorio:**
  - Configurar obligatoriamente **`"apple-mobile-web-app-status-bar-style": "default"`** en `mobile/public/index.html` y `"barStyle": "default"` en `mobile/app.json`.
  - Con `default`, iOS gestiona nativamente la barra de estado de 47px con fondo oscuro corporativo (sin solapamiento ni texto borroso), e inicia el viewport web exactamente en $y=47\text{px}$.
  - El viewport web cubre de $47\text{px}$ a $844\text{px}$ ($47 + 797 = 844\text{px}$), alcanzando de forma natural el borde físico inferior de la pantalla.
  - En `mobile/src/core/hooks/useEdgeInsets.ts`:
    - `tabBarBottomOffset`: `max(calc(env(safe-area-inset-bottom, 0px) - 22px), 12px)`. No restar gaps artificiales.
    - `bottomPadding`: `calc(70px + ${barOffset})` para despejar el contenido detrás de la barra flotante.

### Variables de Entorno Móvil
* **Prefijo Mandatorio:** Toda variable accesible en el código cliente de Expo debe comenzar obligatoriamente con el prefijo **`EXPO_PUBLIC_`**.
* Ejemplo de archivo `.env`:
  ```ini
  EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJh...
  ```
* Consumo en código: `process.env.EXPO_PUBLIC_SUPABASE_URL`.

---

## 3. Plataforma Web Administrativa (`/web`)

- **Tecnología:** Next.js (App Router, versión 16+), React 19, TypeScript estricto.
- **Estilos:** Tailwind CSS v4.

### Regla Estricta: Integración de Supabase (SSR vs. Client)
> **PROHIBICIÓN TOTAL:** No utilizar un cliente singleton genérico importado en Server Components. Provoca fugas de sesión y fallos de hidratación de cookies.

* **Patrón Obligatorio con `@supabase/ssr` y `@supabase/supabase-js`:**
  - **Server Components, Server Actions y Route Handlers:**  
    Instanciar el cliente usando `createServerClient` configurando el adaptador de cookies (`cookies()` de `next/headers`).
    ```typescript
    import { createServerClient } from '@supabase/ssr';
    import { cookies } from 'next/headers';

    export async function createClient() {
      const cookieStore = await cookies();
      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {}
            },
          },
        }
      );
    }
    ```
  - **Client Components (`'use client'`):**  
    Instanciar mediante `createBrowserClient` desde `@supabase/ssr`:
    ```typescript
    import { createBrowserClient } from '@supabase/ssr';

    export function createClient() {
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    ```

### Protección de Rutas y Sesión (Convención `proxy.ts` en Next.js 16+)
* En Next.js 16+, la convención de archivo `middleware.ts` fue reemplazada por **`proxy.ts`** (`export async function proxy(request: NextRequest)`).
* `web/proxy.ts` gestiona la actualización continua de cookies de autenticación vía `@supabase/ssr` y protege todas las rutas no públicas redirigiendo a `/login` si no existe una sesión válida.

### Variables de Entorno Web
* **Prefijo Mandatorio:** Todas las variables de cliente de Next.js deben comenzar con **`NEXT_PUBLIC_`**.
* Ejemplo de archivo `.env.local`:
  ```ini
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
  ```

---

## 4. Backend Cloud (Supabase)

- **Motor Relacional:** PostgreSQL 15+.
- **Row Level Security (RLS):**
  - **OBLIGATORIO:** RLS debe estar activado en el 100% de las tablas del esquema público (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
  - Las políticas deben distinguir operaciones del rol `tecnico` (solo INSERT de incidencias y SELECT de eventos activos) frente al rol `admin` (CRUD total).
- **Autenticación (Supabase Auth):**
  - Acceso mediante correo y contraseña.
  - El rol se propaga mediante metadata del usuario o mediante una tabla relacional `perfiles` enlazada a `auth.users(id)`.
- **Almacenamiento (Supabase Storage):**
  - Bucket: `evidencias-incidencias`.
  - Acceso controlado mediante políticas de Storage (técnicos pueden subir fotos; administradores pueden leer y auditar).
- **Automatización en BD (Triggers / Funciones PL/pgSQL):**
  - Manejo de inventario: Descuento atómico de stock de repuestos ante la resolución de fallas para evitar condiciones de carrera.
