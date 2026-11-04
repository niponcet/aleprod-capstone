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

### Regla Estricta: PWA Móvil en iOS Safari (Resolución Definitiva de Viewport y Status Bar)
> **ARQUITECTURA MANDATORIA:** En la PWA de iOS (modo standalone / pantalla de inicio), la barra de estado superior debe fundirse en armonía cromática con la cabecera corporativa y el fondo debe cubrir el 100% de la pantalla sin cortes ni franjas muertas.

* **La Mecánica de WebKit iOS (Modo Standalone PWA):**
  - Con `apple-mobile-web-app-status-bar-style: black-translucent`, iOS activa un filtro de desenfoque nativo (*frosted glass blur*) sobre la hora y Dynamic Island, y WebKit resta 47px del layout viewport, produciendo la temida "franja inferior" de 47px o deformando los elementos anclados.
  - Con `status-bar-style: default`, iOS inicia el viewport web exactamente en $y=47\text{px}$ y llega hasta $y=844\text{px}$ ($47 + 797 = 844\text{px}$), eliminando de forma natural la franja inferior y manteniendo la Tab Bar perfectamente apoyada sobre el Home Indicator.
* **Solución Definitiva (Fusión Visual Orgánica con el Bezel de Apple):**
  1. **Configuración de Metas:** `"apple-mobile-web-app-status-bar-style": "default"` en `mobile/public/index.html` y `"barStyle": "default"` en `mobile/app.json`.
  2. **Integración Cromática con la Status Bar (`#000000` / `#070B14`):**
     - En PWA standalone de iOS, Apple fuerza la barra de estado a negro sólido (`#000000`) en modo oscuro e ignora `<meta name="theme-color">`.
     - Para eliminar el corte seco horizontal sin sufrir el desenfoque (*frosted blur*) forzado de `black-translucent`, los halos ambientales superiores (`topAmbientGlow`) en todas las pantallas (`HomeScreen`, `EventsScreen`, `SettingsScreen`, `NotificationsScreen`) comienzan en `#000000` en $y=0$, fundiéndose al 100% con el marco de iOS, y florecen progresivamente hacia el azul corporativo (`rgba(14, 34, 72, 0.65)` y `rgba(29, 78, 216, 0.32)`) detrás de las cabeceras.
  3. **Reseteo Limpio de `#root` (`mobile/public/index.html`):**
     ```css
     html {
       position: fixed;
       inset: 0;
       width: 100%;
       background-color: #000000 !important;
       overflow: hidden;
     }
     body {
       position: fixed;
       inset: 0;
       width: 100%;
       background-color: #070B14 !important;
       overflow: hidden;
     }
     #root {
       position: fixed;
       inset: 0;
       width: 100%;
       display: flex;
       flex-direction: column;
       flex: 1;
       background-color: #070B14 !important;
       overflow: hidden;
     }
     ```
  4. **Navegación Flotante (`LiquidGlassTabBar.tsx`):**
     - `overlayContainer`: `position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any`.
     - `slidingIndicator`: estrictamente `position: 'absolute'` dentro de la cápsula.
     - `bottom`: `barOffset` (`max(calc(env(safe-area-inset-bottom, 0px) - 22px), 12px)`). Flota exactamente sobre el Home Indicator con despeje ergonómico de 12px.

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
