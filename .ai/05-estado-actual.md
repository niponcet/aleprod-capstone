# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 28 de Octubre de 2026 (Sesión 46 — Blindaje Anti-Safari Escape y Safe Area Edge-to-Edge OLED en iOS PWA).
- **Fase del Proyecto:** **Fase 3 (Desarrollo Núcleo App/Web)** — Monorepo completo con Mobile (Expo SDK 58, offline-first, sync con Supabase Cloud y Storage) y Web (Dashboard, Login, Palmetas, Eventos, Incidencias conectados en tiempo real).
- **Sprint Activo:** Épica 1 (HU-05 y HU-06 Refinadas con roles Admin/Coordinador/Técnico), Épica 2 (HU-07 y HU-08 Completadas en Web), Épica 3 (HU-10, HU-11, HU-12, HU-13 y HU-16 Completadas en Móvil), Épica 4 (HU-14 y HU-15 Completadas).
- **Salud del Monorepo:** Tipado limpio (`npx tsc --noEmit` exitoso en `/mobile` y `/web` con 0 errores). `21/21` verificaciones aprobadas en `npx expo-doctor`. Build de Next.js 16 con Turbopack exitoso (`13/13` rutas generadas limpiamente).
- **Credenciales Cloud:** `mobile/.env` y `web/.env.local` configurados con proyecto activo de Supabase (`fovmurimpbexfrjwxdew`). Base de datos relacional PostgreSQL con RLS, triggers alineados de código visible y storage bucket `evidencias-incidencias` activos y verificados.

---

## 2. Historias de Usuario (HUs) — Estado de Avance AUDITADO

### Fase 2: Arquitectura y Configuración Cloud (Completada — Infraestructura Base)
- ✅ **HU-01: Infraestructura Base** `[Completada — Supabase Cloud Desplegado]`
- ✅ **HU-02: Inicialización App Móvil y Escaneo Offline** `[Completada]`
- ✅ **HU-03: Inicialización de Entorno Web** `[Completada]`
- 🔄 **HU-04: Diseño de Interfaces UI/UX** `[En Progreso: Prototipado Directo en Código / Sin Figma formal]`

### Fase 3: Desarrollo Núcleo App/Web (En Curso — UI Avanzada / Backend Móvil Conectado)

#### Épica 1: Autenticación
- ✅ **HU-05: Login y Sesión (Web/App)** `[Completada en Web y Móvil]`
  - Móvil: `LoginScreen.tsx` y `AuthContext.tsx` 100% conectados a `supabase.auth.signInWithPassword`, `getSession` y `onAuthStateChange`. Manejo de errores nativo y sesión probada con usuario semilla (`tecnico@aleprod.cl`).
  - Web: `web/app/login/page.tsx` conectada a Supabase Auth y validada con usuario de Gerencia (`gerencia@aleprod.cl`).
  - Usuarios Auth activos: `gerencia@aleprod.cl` (Admin) y `tecnico@aleprod.cl` (Técnico).

#### Épica 2: Plataforma Web
- ✅ **HU-06: Control de Acceso (RBAC)** `[Completada en Base de Datos y Web]`
  - Perfil de `Gerencia` asignado con `rol: 'admin'` en `public.perfiles`.
  - Roles soportados: `admin` (Dirección/Dashboard) y `tecnico` (Terreno/Móvil).
- ✅ **HU-07: Dashboard Central Web & Módulo de Incidencias** `[Completada — Conectada a Supabase en Vivo]`
  - Dashboard Server Component con SSR en Next.js 16 (Turbopack).
  - Consulta en tiempo real de eventos, parque de palmetas, incidencias y estado de repuestos desde Supabase.
  - Identificación del perfil activo (`Gerencia`), métricas KPI y flujo seguro de cierre de sesión (`/auth/signout`).
  - Hero card "Montaje Activo" con cuadrícula estricta de 2x2 para sus métricas (Superficie Asignada / Operativos Disponibles / En Mantención / Dados de Baja).
  - Barra lateral universal fija (`Sidebar` component): Sticky `height: 100vh`, `width: 264px`, activa en todas las vistas (`/`, `/eventos`, `/palmetas`, `/incidencias`), con contadores en tiempo real (badges) sincronizados vía Supabase postgres_changes, tarjeta de perfil y selector de ruta activa.
  - Estandarización de espaciado y altura de viewport: Se eliminó el centrado `mx-auto` en `/palmetas`, `/incidencias` y `/eventos`, unificando el padding del contenedor principal a `28px 32px 40px` y `maxWidth: 1240px` para alinearse a la misma altura y distancia lateral exacta del Dashboard principal.
  - Paleta de diseño corporativo OLED Deep Black (`#0A0A0A`, `#121212`, `#1E1E1E`, `#27272A`, dorado `#D4AF37`) 100% alineada con `.ai/03-ui-ux-branding.md`.
  - Módulo completo de Incidencias (`/incidencias`) adaptado con la barra fija a la izquierda, cabecera ejecutiva y resolución de averías en tiempo real con escritura directa (`UPDATE incidencias SET resuelto=true`).
  - Modal integrado para registrar incidencias de prueba directamente en Supabase Cloud.
  - Sincronización móvil ([mobile/src/modules/settings-sync/screens/SettingsScreen.tsx](file:///c:/Users/lucas/Downloads/Panel%20ALE/aleprod-capstone/mobile/src/modules/settings-sync/screens/SettingsScreen.tsx)) conectada a Supabase con envío por lotes de `incidencias_locales` (SQLite) hacia `public.incidencias` Cloud.
- ✅ **HU-08: CRUD de Activos Serializados (Web)** `[Completada — Implementada en web/app/palmetas/page.tsx]`
  - Módulo de palmetas LED (`/palmetas`) adaptado con la barra lateral universal izquierda fija y cabecera ejecutiva unificada.
  - KPIs semánticos: Total Parque, Operativas (Verde), En Taller (Ámbar), De Baja (Rojo).
  - Filtros por estado operativo (operativo / mantención / baja) y buscador por código visible, UUID y lote.
  - Tabla ejecutiva con badges de estado, ubicación, lote y última revisión.
  - Modal de ficha técnica con grid de información detallada y cambio de estado operativo con actualización directa en Supabase (`UPDATE palmetas_led`).
  - Selector de ubicación post-cambio (Bodega Central / En Evento / Taller Técnico).
- ✅ **HU-08B: Módulo de Gestión de Eventos y Producciones (Web)** `[Completada — Implementada en web/app/eventos/page.tsx]`
  - Módulo de eventos (`/eventos`) adaptado con la barra lateral universal fija y cabecera ejecutiva unificada.
  - Filtros por estado de producción (En Curso, Planificado, Finalizado) y modal para registrar nuevos eventos.
- ❌ **HU-09: Gestión de Inventario a Granel (Web)** `[No Iniciado]`

#### Épica 3: Operación Móvil en Terreno
- ✅ **HU-10: Módulo de Sesión Activa por Evento** `[Completada]`
  - `EventsScreen.tsx`: Cabecera fija limpia con badge contador. Botón de alta "Iniciar Evento" con diseño sobrio y equilibrado en superficie oscura elevada con acento ámbar. Conectado a Supabase `eventos` con pull-to-refresh.
  - `StartEventBottomSheet.tsx`: Bottom Sheet con selector multi-servicio (Pista de Baile LED + Pirotecnia opcional), selector/buscador de recintos frecuentes, stepper/chips de m² e inserción directa en Supabase con estado `en_curso` y `tecnico_id`.
  - `HomeScreen.tsx`: Totalmente conectado al evento real activo (híbrido Supabase + SQLite `getActiveLocalEvento`). Si existe evento en curso, renderiza la card dinámica con nombre, recinto, metros configurados y navegación táctil al detalle (`/event-detail`); si no hay eventos activos, renderiza card de estado vacío "Sin Montaje Activo" con acceso rápido a la agenda.
- 🔄 **HU-11: Formulario de Incidencias In Situ** `[En Progreso: Flujo Camera-First Anti-Huérfanas Implementado / Sincronización Manual Lista (HU-14)]`
  - Implementación de `IncidentScannerModal.tsx` integrado en `EventDetailScreen.tsx` para captura directa de QR en terreno previo al formulario (Regla de 3 Taps estricta).
  - `ReportIncidentModal.tsx` refactorizado: bloqueo de incidencias huérfanas exigiendo identificación de palmeta, visualización destacada de `qrUuid` verificado, entrada manual de contingencia (`TextInput`) si el código físico está roto/dañado, y vinculación dinámica del `evento_id`/`eventoNombre` real.
- ✅ **HU-12: Captura y Subida de Evidencia Fotográfica** `[Completada]`
  - Bucket `evidencias-incidencias` creado en Supabase Storage con políticas de inserción autenticada y lectura pública.
  - Subida de evidencias fotográficas locales (`file://`) desde SQLite a Supabase Storage bucket `evidencias-incidencias` utilizando `expo-file-system` (lectura Base64) y `base64-arraybuffer` (decodificación a ArrayBuffer).
  - Obtención y almacenamiento de `publicUrl` permanente en la nube vinculada a cada incidencia.
- ✅ **HU-13: Aprovisionamiento Masivo (Modo Ráfaga)** `[Completada]`
  - Conexión real de `ScannerScreen.tsx` con Supabase `palmetas_led` (`codigo_qr`, `estado = 'operativo'`, `lote_ingreso`).
  - Detección instantánea de duplicados mediante código de error Postgres `23505` y restricciones de unicidad, mostrando toast/banner visual rápido no bloqueante ("Palmeta ya registrada") sin pausar el flujo de ráfaga.
  - Resiliencia Offline: almacenamiento de contingencia en la nueva tabla local SQLite `palmetas_pendientes` (`insertPendingPalmeta`).
  - Integración al motor de sincronización `sync.ts` (`syncPendingPalmetas`) y pantalla de configuración `SettingsScreen.tsx` para sincronización combinada.
- ✅ **HU-16: Ciclo de Vida e Historial de Eventos** `[Completada]`
  - Implementación de control de estados (`en_curso` vs `finalizado`) tanto en PostgreSQL Supabase como en SQLite local (`eventos_locales`).
  - `EventsScreen.tsx`: Pestañas interactivas "En Curso" e "Historial" con contadores en tiempo real, navegación táctil al detalle del evento y auto-refresco vía `useFocusEffect`.
  - `EventDetailScreen.tsx`: Vista detallada con metadata operativa (superficie $m^2$, recinto, configuración de equipamiento), trazabilidad de incidencias mediante consulta híbrida (SQLite offline + Supabase remoto), botón de cierre ("Finalizar Evento") y protección estricta en modo Read-Only cuando el evento está archivado.

#### Épica 4: Persistencia y Sincronización
- ✅ **HU-14: Motor de Sincronización a Supabase** `[Completada]`
  - Módulo de sincronización en lote `mobile/src/core/api/sync.ts` (`syncPendingIncidencias`).
  - Subida de imágenes pendientes a Supabase Storage y batch INSERT a la tabla `incidencias` en PostgreSQL.
  - Resolución de claves foráneas resiliente (`palmeta_id` y `evento_id` por UUID o nombre).
  - Actualización local atómica a `sincronizado = 1` y guardado de `remoteFotoUrl` únicamente ante confirmación exitosa de la nube.
  - `SettingsScreen.tsx` refactorizado con estado de carga nativo (`ActivityIndicator`), retroalimentación por `Alert` con métricas exactas y manejo tolerante a fallos/modo offline sin pérdida de datos locales.
- ✅ **HU-15: Trigger de Descuento de Stock** `[Completada]`
  - Trigger PostgreSQL `tr_descontar_stock_repuesto` desplegado y activo en Supabase Cloud sobre `consumo_repuestos` y `repuestos_inventario`.

---

## 3. Estado de la Infraestructura y Archivos Clave

| Componente | Ruta | Estado Actual |
| :--- | :--- | :--- |
| **Arnés de Contexto** | `AGENTS.md` y `.ai/*.md` | Centralizado en raíz, 5 módulos activos y actualizados. |
| **Enrutamiento Móvil (Expo Router)** | `mobile/app/` | `<NativeTabs>` con Liquid Glass iOS, SF Symbols, botón QR flotante, `login.tsx` y `event-detail.tsx` conectados. |
| **Core Móvil** | `mobile/src/core/` | `theme/colors.ts`, `api/supabase.ts` (✅ credenciales activas), `db/database.ts` (SQLite síncrona con `incidencias_locales`, `palmetas_pendientes` y `eventos_locales`), `context/AuthContext.tsx` (✅ 100% Supabase Auth). |
| **Módulos Móvil** | `mobile/src/modules/` | 4 módulos con UI premium completa. `EventsScreen.tsx` (tabs y navegación), `EventDetailScreen.tsx` (trazabilidad y cierre de evento), `LoginScreen.tsx` 100% integrado a Supabase Auth, `ScannerScreen.tsx` (ráfaga continua). |
| **Web (Admin)** | `web/` | ✅ **Funcional.** Login (`/login`), Dashboard SSR (`/`), Incidencias (`/incidencias`), **Palmetas LED (`/palmetas`)**, **Eventos (`/eventos`)** — todos conectados a Supabase Cloud con middleware de sesión y barra lateral universal. |
| **Entornos y Secretos** | `mobile/.env`, `web/.env.local` | `mobile/.env` y `web/.env.local` con credenciales reales del proyecto `fovmurimpbexfrjwxdew`. |

---

## 4. Próximos Pasos Inmediatos (Post-Auditoría)

1. **Fase 3 - Épica 2 (Inventario a Granel Web - HU-09):**
   - Construir módulo de repuestos y consumo en la plataforma web.
2. **Optimización HU-11 (Auto-sincronización opcional):**
   - Disparar sync en segundo plano inmediatamente tras registrar incidencia si el dispositivo cuenta con red activa.

---

## 5. Bitácora de Cambios Recientes (Session Log)

- **2026-10-28 (Sesión 46 — Blindaje Anti-Safari Escape y Safe Area Edge-to-Edge OLED en iOS PWA):**
  - **Erradicación del 'Safari Escape' en iOS Standalone:**
    - Se configuró explícitamente `"scope": "/"` dentro de `mobile/app.json` bajo la clave `"web"`. Al delimitar el scope a toda la raíz, WebKit ya no clasifica la navegación a rutas internas como "fuera de alcance" (out of scope).
    - En `LoginScreen.tsx`, se garantizó que tras el login exitoso la redirección se ejecute de forma inmediata y exclusiva mediante el enrutador cliente de Expo (`router.replace('/(tabs)')`), descartando cualquier recarga dura o salto de ventana.
  - **Fondo de Safe Area Edge-to-Edge Real (#0A0A0A):**
    - En `mobile/app/_layout.tsx`, se fijó el estilo `style={{ flex: 1, backgroundColor: '#0A0A0A' }}` en el `SafeAreaProvider` y en el contenedor raíz que envuelve al `<Stack>`.
    - Se integró el `ThemeProvider` de Expo Router inyectando un `customDarkTheme` (`DarkTheme` con `colors.background: '#0A0A0A'` y `colors.card: '#0A0A0A'`), erradicando el destello/fondo gris claro (`#f2f2f2`) por defecto de React Navigation en el área del notch.
    - En `LoginScreen.tsx`, se encapsuló el árbol visual en un contenedor `View` externo de fondo estricto `#0A0A0A` antes de aplicar los insets de `SafeAreaView`.
    - Se estandarizó `<StatusBar style="light" />` de `expo-status-bar` en el Root Layout y pantalla de login para garantizar íconos de sistema blancos (reloj, batería y señal).
  - **Verificación Técnica:**
    - `npx tsc --noEmit` en `/mobile`: **0 errores de compilación**.
    - Validación sintáctica de `app.json`: limpia y evaluada.
- **2026-10-28 (Sesión 45 — Forzado de startUrl en Web Manifest y Rewrites a Raíz para PWA en Vercel):**
  - **Inyección de `startUrl: "/"` en `mobile/app.json`:**
    - Garantiza que el `manifest.json` generado por Expo obligue a iOS Safari y Android a inicializar la PWA siempre desde la raíz (`/`), impidiendo que el sistema operativo ancle directamente a la subruta `/login` y evitando errores 404 al abrir el acceso directo de pantalla de inicio.
  - **Alineación de Rewrites en `mobile/vercel.json`:**
    - Actualización de regla de fallback SPA a `"source": "/(.*)", "destination": "/"` para resolución nativa del directorio raíz de salida en Vercel.
  - **Verificación Técnica:**
    - Sintaxis JSON validada sin errores en `app.json` y `vercel.json`.
    - `npx expo config --type public` evaluado exitosamente.
    - `npx tsc --noEmit` en `/mobile`: **0 errores**.
- **2026-10-28 (Sesión 44 — Desbloqueo y Polyfill de Alert.alert para React Native Web/PWA, Eliminación de Redundancia en SignOut):**
  - **Diagnóstico del Fallo de 'Cerrar Sesión' en Modo PWA:**
    - En React Native Web (`react-native-web`), la API `Alert.alert` está deliberadamente definida como un método vacío stub (`class Alert { static alert() {} }`).
    - Al presionar el botón "Cerrar Sesión" en la versión PWA o navegador móvil, `Alert.alert` retornaba de inmediato sin renderizar ningún diálogo y sin ejecutar el callback `onPress` del array de botones, congelando la interacción para el usuario.
  - **Polyfill Universal de Alertas Web (`mobile/src/core/utils/alertPolyfill.ts`):**
    - Se creó `setupAlertPolyfill()` activado en el montaje raíz (`mobile/app/_layout.tsx`).
    - Redirige alertas con un solo botón a `window.alert` y diálogos de confirmación o acción destructiva con múltiples botones a `window.confirm`, invocando automáticamente el callback correspondiente (`confirmButton.onPress` o `cancelButton.onPress`). Esto restaura de forma retroactiva el funcionamiento de todos los avisos informativos, errores y confirmaciones de la app móvil en entornos PWA.
  - **Refactorización Limpia de Cerrar Sesión (`mobile/src/modules/settings-sync/screens/SettingsScreen.tsx`):**
    - Se incorporó soporte explícito de confirmación en web (`window.confirm`) dentro de `handleLogout` con fallback a `Alert.alert` en plataformas nativas.
    - Se eliminó la doble invocación redundante de `supabase.auth.signOut()`: ahora `SettingsScreen` delega limpiamente la revocación y purga de estado a `onSignOut()` (`AuthContext.signOut()`).
  - **Verificación Técnica:**
    - `npx tsc --noEmit` en `/mobile`: **0 errores de compilación**.
- **2026-10-27 (Sesión 43 — Shell PWA Nativo Edge-to-Edge para iOS Standalone, Safe Areas Dinámicas y Despeje de Home Indicator en TabBar):**
  - **Diagnóstico de Defectos Visuales en iOS PWA Standalone:**
    1. Al abrir la app en iPhone como PWA en pantalla completa, la falta de `apple-mobile-web-app-status-bar-style: black-translucent` combinada con fondo blanco por defecto en WebKit provocaba una franja clara y forzaba íconos del sistema negros (hora, señal, batería) en vez de blancos.
    2. La barra inferior `LiquidGlassTabBar` y el botón flotante QR chocaban con el Home Indicator de iOS al no considerar las variables de entorno de área segura en navegadores móviles (`env(safe-area-inset-bottom)`).
  - **Control Total del Shell PWA en `mobile/app/+html.tsx`:**
    - Inclusión de directivas de viewport e identidad nativa de WebKit:
      - `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />`
      - `<meta name="theme-color" content="#0A0A0A" />`
      - `<meta name="apple-mobile-web-app-capable" content="yes" />`
      - `<meta name="mobile-web-app-capable" content="yes" />`
      - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
    - Inyección de bloque `<style>` global forzando:
      - `html, body, #root { background-color: #0A0A0A !important; min-height: 100dvh; margin: 0; padding: 0; overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; }`
      - `input, textarea, select { font-size: 16px !important; }` (eliminación de raíz de cualquier riesgo residual de auto-zoom).
  - **Configuración de Manifiesto Nativo en `mobile/app.json`:**
    - Ajustado `"userInterfaceStyle": "dark"` para forzar modo oscuro en iOS y Android.
    - Configurado en `"web"`: `"backgroundColor": "#0A0A0A"`, `"themeColor": "#0A0A0A"`, `"display": "standalone"`, `"barStyle": "black-translucent"`, y meta tags equivalentes.
  - **Calibración de Safe Areas Superiores e Inferiores:**
    - **LiquidGlassTabBar.tsx:** Cálculo de `bottomOffset` adaptado para web/PWA a `'calc(env(safe-area-inset-bottom, 0px) + 20px)'`, logrando una elevación de 54px en iPhones con notch/Dynamic Island (despejando holgadamente los 34px del Home Indicator) y 26-44px en nativo.
    - **HomeScreen.tsx, EventsScreen.tsx y SettingsScreen.tsx:** Header `paddingTop` calibrado a `Platform.OS === 'web' ? 'calc(env(safe-area-inset-top, 0px) + 16px)' : Math.max(insets.top, 20) + 16`, evitando cualquier colisión con la Dynamic Island o barra de estado en modo Edge-to-Edge.
    - **Barras de Estado:** Estandarizado `<StatusBar barStyle="light-content" />` y fondos raíces `#080C14` / `#0A0A0A` que se extienden hasta el borde físico superior (`top: 0`), eliminando props no estándar para tipado limpio multiplataforma.
  - **Verificación Técnica de Salud del Monorepo:**
    - `npx tsc --noEmit` en `/mobile`: **0 errores**.
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build` en `/web`: **Compilación exitosa (Turbopack, Next.js 16.3.8) con 13/13 rutas operativas**.

- **2026-10-27 (Sesión 42 — Erradicación del Auto-Zoom de iOS Safari en Inputs/Textareas/Selects para Web y PWA Móvil):**
  - **Diagnóstico del Auto-Zoom en Safari iOS:**
    - Safari en iOS activa un zoom automático intrusivo e irreversible de viewport cuando un control de formulario (`<input>`, `<textarea>`, `<select>`) recibe foco y su tamaño de fuente computado es inferior a 16px (como ocurría con clases `text-sm`, `text-xs` o `fontSize: 13-15`).
  - **Auditoría y Solución en el Panel Web (`/web`):**
    - **Configuración de Viewport en Layout:** En [web/app/layout.tsx](file:///c:/workspace/aleprod-capstone/web/app/layout.tsx), se exportó el objeto de configuración tipado `viewport: Viewport` con `width: 'device-width'`, `initialScale: 1`, `maximumScale: 1`, `userScalable: false`.
    - **Base CSS en globals.css:** En [web/app/globals.css](file:///c:/workspace/aleprod-capstone/web/app/globals.css), la clase `.input-field` se calibró a `font-size: 16px` por defecto en móviles, con media query `@media (min-width: 768px) { font-size: 14px; }` para el entorno de escritorio.
    - **Reemplazo Responsivo `text-[16px] md:text-sm` en Componentes y Páginas:**
      - [web/app/(auth)/login/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(auth)/login/page.tsx): Inputs de email y contraseña actualizados a `text-[16px] md:text-sm`.
      - [web/app/(auth)/recuperar/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(auth)/recuperar/page.tsx): Input de correo para restablecimiento actualizado a `text-[16px] md:text-sm`.
      - [web/app/(auth)/actualizar-contrasena/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(auth)/actualizar-contrasena/page.tsx): Inputs de nueva contraseña y confirmación actualizados a `text-[16px] md:text-sm`.
      - [web/app/components/dashboard-view.tsx](file:///c:/workspace/aleprod-capstone/web/app/components/dashboard-view.tsx): Input de búsqueda en dashboard y todos los campos del modal de nueva producción (Nombre, Locación, Superficie m², Fecha, Tipo de Instalación) actualizados eliminando el fontSize hardcodeado y aplicando `text-[16px] md:text-sm`.
      - [web/app/(dashboard)/palmetas/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(dashboard)/palmetas/page.tsx): Input de búsqueda de activos y `<select>` de reubicación en modal técnico migrados de `text-xs` a `text-[16px] md:text-sm`.
      - [web/app/(dashboard)/eventos/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(dashboard)/eventos/page.tsx): Input de búsqueda, selectores de estado en tabla (`text-[16px] md:text-xs`) y todos los campos del modal de creación actualizados a `text-[16px] md:text-sm`.
      - [web/app/(dashboard)/incidencias/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(dashboard)/incidencias/page.tsx): Buscador, textarea de resolución técnica, selectores del modal de incidencia y textarea de observaciones migrados de `text-xs` a `text-[16px] md:text-sm`.
      - [web/app/(dashboard)/palmetas/etiquetado/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(dashboard)/palmetas/etiquetado/page.tsx): Inputs de lote, cantidad personalizada y búsqueda de activo migrados a `text-[16px] md:text-xs` / `md:text-sm`.
      - [web/app/components/eventos-section.tsx](file:///c:/workspace/aleprod-capstone/web/app/components/eventos-section.tsx): Inputs y selectores actualizados a `text-[16px] md:text-sm`.
  - **Auditoría y Solución en la App Móvil / PWA (`/mobile`):**
    - **Configuración Web de Expo y HTML Template:** En [mobile/app.json](file:///c:/workspace/aleprod-capstone/mobile/app.json), se inyectó `"meta": { "viewport": "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" }` bajo la clave `expo.web`. Asimismo, se creó [mobile/app/+html.tsx](file:///c:/workspace/aleprod-capstone/mobile/app/+html.tsx) con la plantilla HTML universal de Expo Router aplicando el meta tag `viewport` anti-zoom.
    - **Estandarización de `fontSize: 16` en React Native `<TextInput>`:**
      - [mobile/src/modules/auth/screens/LoginScreen.tsx](file:///c:/workspace/aleprod-capstone/mobile/src/modules/auth/screens/LoginScreen.tsx): Inputs de credenciales calibrados a `fontSize: 16` (desde 15).
      - [mobile/src/modules/auth/screens/ForgotPasswordScreen.tsx](file:///c:/workspace/aleprod-capstone/mobile/src/modules/auth/screens/ForgotPasswordScreen.tsx): Input de email calibrado a `fontSize: 16` (desde 14).
      - [mobile/src/modules/home-event/components/StartEventBottomSheet.tsx](file:///c:/workspace/aleprod-capstone/mobile/src/modules/home-event/components/StartEventBottomSheet.tsx): Inputs de nombre del evento y recinto calibrados a `fontSize: 16` (desde 14). El input de metros cuadrados preserva `fontSize: 20` (>= 16).
      - [mobile/src/modules/home-event/screens/ActivityHistoryScreen.tsx](file:///c:/workspace/aleprod-capstone/mobile/src/modules/home-event/screens/ActivityHistoryScreen.tsx): Barra de búsqueda en vivo calibrada a `fontSize: 16` (desde 13).
      - [mobile/src/modules/scanner-incidents/components/ReportIncidentModal.tsx](file:///c:/workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/components/ReportIncidentModal.tsx): Input manual de código QR de contingencia y textarea de observaciones calibrados a `fontSize: 16` (desde 13).
    - **Tipado TypeScript en LiquidGlassTabBar:** Añadido `navigateToTab?: (key: string) => void` a `LiquidGlassTabBarProps` en [mobile/src/core/components/LiquidGlassTabBar.tsx](file:///c:/workspace/aleprod-capstone/mobile/src/core/components/LiquidGlassTabBar.tsx).
  - **Verificación Técnica de Salud del Monorepo:**
    - `npx tsc --noEmit` en `/mobile`: **0 errores**.
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build` en `/web`: **13/13 rutas generadas exitosamente con Turbopack**.

- **2026-10-27 (Sesión 41 — Estandarización de Espaciado Full-Width y Erradicación del Límite max-w-[1240px] Asimétrico en Web):**
  - **Diagnóstico del Contenido Apegado a la Izquierda:**
    - Se identificó que mientras los `<header>` de la barra superior ocupaban el 100% del viewport horizontal (`w-full`), los contenedores `<main>` de todos los módulos (`DashboardView`, `palmetas`, `eventos`, `incidencias` y `palmetas/etiquetado`) poseían la clase rígida `max-w-[1240px]` sin expansión horizontal ni justificación simétrica. En pantallas de 1080p, 2K o superiores, esto generaba un espacio negro vacío de más de 400px en el lateral derecho, haciendo que las acciones superiores (e.g., botón "+ Nuevo evento") quedasen desalineadas y aisladas en el extremo derecho respecto al cuerpo de contenido.
  - **Corrección y Aprovechamiento Total del Espacio Horizontal (`w-full flex-1`):**
    - Se removió `max-w-[1240px]` en todos los módulos (`dashboard-view.tsx`, `palmetas/page.tsx`, `eventos/page.tsx`, `incidencias/page.tsx`, `palmetas/etiquetado/page.tsx`), unificando el contenedor principal a `p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1`.
    - En [dashboard-view.tsx](file:///c:/workspace/aleprod-capstone/web/app/components/dashboard-view.tsx), se recalibraron las proporciones de la sección inferior: la tabla de eventos adopta `lg:flex-1 min-w-0` y la columna lateral de resúmenes adopta `lg:w-[360px] xl:w-[400px] shrink-0 min-w-0`, asegurando un balance visual armónico donde las filas de producciones respiran con amplitud sin comprimir los indicadores de "Requiere atención" y "Estado del parque".
    - En [palmetas/etiquetado/page.tsx](file:///c:/workspace/aleprod-capstone/web/app/(dashboard)/palmetas/etiquetado/page.tsx), se incorporó la escala `2xl:grid-cols-5` a la grilla de stickers para aprovechar de forma fluida monitores ultra-anchos.
    - Se corrigieron los footers de todas las páginas secundarias (`maxWidth: "1240px"` -> `width: "100%"`), alineando su contenido de borde a borde con los encabezados y tablas.
  - **Verificación Técnica:**
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build`: **Compilación exitosa (Turbopack, Next.js 16.3.8) con 13/13 rutas operativas**.

- **2026-10-24 (Sesión 40 — Rediseño Pixel-Perfect de Login 40/60, Menú Móvil con Físicas Emil Kowalski y Eliminación de UI Redundante en Web):**
  - **Rediseño Pixel-Perfect del Login ([web/app/(auth)/login/page.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(auth)/login/page.tsx)):**
    - Réplica 1:1 de `web/design/Inicio de sesión · 40 60-html/Login.dc.html` adaptada a React 19, TypeScript y Tailwind CSS v4.
    - **Pantalla Completa Estricta y Cero Scroll (`h-screen h-[100dvh] overflow-hidden`):** Se eliminó el scroll vertical en todas las pantallas. En móviles, la columna de marca/LED se oculta por completo (`hidden lg:flex`), mostrando de forma exclusiva el formulario centrado sin desplazamiento vertical. En escritorios, ambas columnas quedan contenidas al 100% del viewport.
    - **Eliminación del Toggle Sol/Luna:** Se retiró el botón de cambio de tema diurno/nocturno, adoptando de forma definitiva y limpia el modo oscuro de alto contraste corporativo.
    - Columna de Marca (40% en escritorio): Fondo `#08090D`, matriz LED animada de 150 celdas calculada matemáticamente, badges "SISTEMA OPERATIVO" y "AP-CORE-SYS V4.8", y 3 tarjetas de capacidades ("Control en tiempo real", "Trazabilidad de cada falla", "Inventario siempre al día").
    - Columna de Formulario (100% en móvil / 60% en escritorio): Badge AP corporativo, badge "ÁREA RESTRINGIDA", inputs compactos calibrados (`h-12`), toggle de visibilidad SVG, checkbox "Recordar este equipo seguro (30 días)", enlace de recuperación `/recuperar`, y botón principal dorado con micro-interacciones suaves (`duration-200`, `active:scale-97`).
    - Integración completa con Supabase Auth SSR (`signInWithPassword`), manejo de estados de carga con spinners accesibles, mensajes de error y redirección limpia al dashboard.
  - **Reparación del Header y Drawer Móvil ([web/app/(dashboard)/layout.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(dashboard)/layout.tsx) y [web/app/components/sidebar.tsx](file:///c:/Workspace/aleprod-capstone/web/app/components/sidebar.tsx)):**
    - Inversión de elementos en el Mobile Header: Botón Hamburguesa a la **izquierda** y Logo / Nombre corporativo "ALEPROD" a la **derecha**.
    - Corrección del bug de cierre instantáneo: Se estabilizaron los callbacks `onClose` con `useCallback` y se introdujo `lastPathnameRef` en `Sidebar` para que el efecto de cambio de ruta solo se dispare al cambiar de URL y no en cada re-render del layout.
    - Físicas Emil Kowalski en el cajón deslizante: Backdrop con transición suave de opacidad (`bg-black/75 backdrop-blur-sm`), drawer con curva elástica `cubic-bezier(0.23, 1, 0.32, 1)`, bloqueo de scroll del `body` mientras el drawer está desplegado, y cierre fluido al tocar fuera o presionar `✕`.
  - **Eliminación de UI Redundante y Botoneras Duplicadas:**
    - `web/app/(dashboard)/eventos/page.tsx`: Eliminados los botones redundantes "Refrescar" y "Nueva Producción" del banner interior, unificando la botonera de control en la cabecera sticky superior con botón "Actualizar" y "Nuevo Evento".
    - `web/app/(dashboard)/palmetas/page.tsx`: Eliminado el botón duplicado "Actualizar Datos" del banner interior, manteniendo la cabecera limpia con "Centro de Etiquetado QR" y "Actualizar".
    - `web/app/(dashboard)/incidencias/page.tsx`: Eliminados los botones redundantes del contenido interior, consolidando "Actualizar" y "Nueva Incidencia" en la cabecera principal.
    - Estandarización de espaciados: `p-4 sm:p-6 lg:p-8` garantizando máximo aprovechamiento horizontal en celulares sin márgenes asfixiantes y respiración generosa en escritorio.
  - **Verificación Técnica:**
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build`: **Compilación exitosa (Turbopack, Next.js 16.3.8) con las 13 rutas operativas**.

- **2026-10-24 (Sesión 39 — Diseño Responsive Completo para Móviles y Tablets en Web con Tailwind CSS):**
  - **Layout Principal y Mobile Header ([web/app/(dashboard)/layout.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(dashboard)/layout.tsx)):**
    - Contenedor principal adaptado a `flex-col md:flex-row`.
    - Cabecera móvil (`md:hidden`) sticky con logo "ALEPROD", badge "AP" dorado y botón de menú hamburguesa (`menu` en Material Symbols).
    - Estado reactivo `isMobileMenuOpen` para controlar la apertura del drawer lateral.
  - **Sidebar como Drawer Lateral ([web/app/components/sidebar.tsx](file:///c:/Workspace/aleprod-capstone/web/app/components/sidebar.tsx)):**
    - Drawer animado con `fixed inset-y-0 left-0 w-72 max-w-[85vw]` y transición fluida `-translate-x-full md:translate-x-0`.
    - Backdrop con desenfoque (`bg-black/80 backdrop-blur-sm md:hidden`) para cerrar al tocar fuera.
    - Botón de cierre (`close`) en el drawer para móviles.
    - Cierre automático al navegar entre rutas (`useEffect` con `pathname`) o hacer clic en cualquier enlace.
    - Conservación 100% intacta del sidebar fijo sticky de 264px en pantallas de escritorio (`>= md`).
  - **Grillas Adaptables en Dashboard ([web/app/components/dashboard-view.tsx](file:///c:/Workspace/aleprod-capstone/web/app/components/dashboard-view.tsx)):**
    - Tarjetas KPI adaptadas a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`.
    - Sección de Montaje Activo y métricas operativas con `grid grid-cols-1 sm:grid-cols-2 gap-3`.
    - Contenedor de Eventos y columna lateral "Requiere atención" reestructurados a `flex-col lg:flex-row gap-6` para fluir verticalmente en pantallas pequeñas.
    - Padding responsivo `p-4 sm:p-6 lg:p-8` eliminando márgenes rígidos en móviles.
  - **Tablas con Desplazamiento Horizontal (`eventos`, `palmetas`, `incidencias`):**
    - Tablas envueltas en `<div className="w-full overflow-x-auto pb-2">` con anchos mínimos calibrados (`min-w-[700px]`).
  - **Centro de Etiquetado QR ([web/app/(dashboard)/palmetas/etiquetado/page.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(dashboard)/palmetas/etiquetado/page.tsx)):**
    - Grilla de stickers en pantalla ajustada a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
    - Tabla de reimpresión envuelta en contenedor scrollable horizontal.
  - **Depuración de Lockfiles en Monorepo:**
    - Se eliminó el archivo residual y vacío `package-lock.json` de la raíz del monorepo (`C:\Workspace\aleprod-capstone\package-lock.json`), erradicando por completo el warning de Turbopack (`Next.js inferred your workspace root, but it may not be correct`).
  - **Verificación:**
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build`: **Compilación 100% limpia sin advertencias (Turbopack, Next.js 16.3.8) con 13/13 rutas operativas**.

- **2026-10-24 (Sesión 38 — Flujo Completo de Recuperación de Contraseña en Web):**
  - **Enlace en Login ([web/app/(auth)/login/page.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(auth)/login/page.tsx)):**
    - Se integró el enlace `¿Olvidaste tu contraseña?` apuntando a `/recuperar`.
  - **Vista de Solicitud ([web/app/(auth)/recuperar/page.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(auth)/recuperar/page.tsx)):**
    - Diseño idéntico Dark Luxury OLED en dos columnas.
    - Envío de enlace con `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/actualizar-contrasena` })`.
  - **Vista de Nueva Contraseña ([web/app/(auth)/actualizar-contrasena/page.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(auth)/actualizar-contrasena/page.tsx)):**
    - Inputs para nueva contraseña y confirmación con validación de matching y longitud mínima (6 caracteres).
    - Ejecución de `supabase.auth.updateUser({ password })` y redirección automática al Dashboard (`/`).
  - **Alineación de Seguridad en `proxy.ts`:**
    - Se habilitaron las rutas públicas `/recuperar` y `/actualizar-contrasena` en la lista blanca de autenticación sin bloquear las peticiones entrantes.
  - **Verificación:**
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build`: **13/13 rutas compiladas limpiamente en Turbopack**.

- **2026-10-24 (Sesión 37 — Migración Oficial de `middleware.ts` a `proxy.ts` en Next.js 16):**
  - **Ejecución del Codemod Oficial:**
    - Se ejecutó `npx @next/codemod@canary middleware-to-proxy . --force` migrando `middleware.ts` a [web/proxy.ts](file:///c:/Workspace/aleprod-capstone/web/proxy.ts) (`export async function proxy(request: NextRequest)`).
  - **Auditoría de Supabase Auth SSR:**
    - Verificación del flujo de cookies (`getAll` y `setAll`) con `@supabase/ssr`, validación de sesión (`supabase.auth.getUser()`) y redirecciones a `/login` para rutas protegidas y a `/` para usuarios autenticados.
  - **Eliminación Total de Warnings:**
    - El warning `The "middleware" file convention is deprecated. Please use "proxy" instead` desapareció por completo.
  - **Verificación:**
    - `npx tsc --noEmit`: **0 errores**.
    - `npm run build`: **Compilación exitosa en 4.3s (Turbopack)** reconociendo `ƒ Proxy (Middleware)`.

- **2026-10-24 (Sesión 36 — Refactorización con Route Groups y Construcción del Centro de Etiquetado QR):**
  - **Refactorización de Arquitectura con Route Groups:**
    - Se creó el Route Group `(auth)` moviendo `/login` de forma transparente.
    - Se creó el Route Group `(dashboard)` con layout persistente ([web/app/(dashboard)/layout.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(dashboard)/layout.tsx)), montando `<Sidebar />` una única vez a nivel de layout y eliminando montajes/desmontajes duplicados en cada cambio de vista.
    - Se limpiaron los wrappers redundantes en `dashboard-view.tsx`, `eventos/page.tsx`, `palmetas/page.tsx` e `incidencias/page.tsx`.
    - Se actualizó [web/app/components/sidebar.tsx](file:///c:/Workspace/aleprod-capstone/web/app/components/sidebar.tsx) con soporte nativo de subrutas activas (`pathname.startsWith(item.href)`) y `print:hidden` para impresión limpia.
  - **Construcción del Centro de Etiquetado y Serialización QR ([web/app/(dashboard)/palmetas/etiquetado/page.tsx](file:///c:/Workspace/aleprod-capstone/web/app/(dashboard)/palmetas/etiquetado/page.tsx)):**
    - Instalación de `qrcode.react` (`QRCodeSVG` vectorizado).
    - **Pestaña 1 (Emisión de Stickers Vírgenes):** Generación masiva en cliente con `crypto.randomUUID()` y derivación determinista `PL-XXXXXX` sin inserción en BD (preservando el inventario de registros huérfanos). Selector de lote y cantidades rápidas (12, 24, 48, 96 o personalizable).
    - **Pestaña 2 (Reimpresión por Deterioro):** Búsqueda reactiva de activos registrados en `palmetas_led` con selección unitaria o masiva para reemplazo físico de etiquetas.
    - **Modal de Vista Escaneo (Demo en Vivo):** Modal interactivo con QR gigante en alto contraste (fondo blanco, código negro) y UUID copiable para probar escaneo inmediato desde la pantalla con la app móvil.
    - **Modo Impresión Física / PDF (`@media print`):** Formato automático para hojas autoadhesivas Carta/A4 (grilla de 3 columnas x 8 filas, sin sidebars ni controles de navegación).
  - **Verificación:**
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build`: **11/11 rutas compiladas exitosamente con Turbopack** (`/palmetas/etiquetado` operativa).

- **2026-10-24 (Sesión 35 — Instalación de Dependencias Web y Validación de Build Next.js 16):**
  - **Instalación de Dependencias (`/web`):**
    - Se ejecutó `npm install` instalando los 374 paquetes necesarios en `web/node_modules`.
    - Se generó el archivo de configuración de entorno [web/.env.local](file:///c:/Workspace/aleprod-capstone/web/.env.local) con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - **Corrección de Tipado TypeScript:**
    - Se corrigió [web/app/layout.tsx](file:///c:/Workspace/aleprod-capstone/web/app/layout.tsx) tipando `children: React.ReactNode` en `RootLayout`.
  - **Verificación:**
    - `npx tsc --noEmit` en `/web`: **0 errores**.
    - `npm run build` en `/web`: **Compilación exitosa (Turbopack, Next.js 16.3.8)** de todas las rutas (`/`, `/eventos`, `/palmetas`, `/incidencias`, `/login`, `/auth/*`).

- **2026-10-24 (Sesión 34 — Alineación Determinista de `codigo_visible` en Supabase y App Móvil para Enrolamiento QR):**
  - **Corrección de Trigger en Supabase (`fn_sync_palmeta_fields`):**
    - Se refactorizó la función en PostgreSQL para calcular `codigo_visible` derivándolo de forma determinista de los últimos 6 caracteres alfanuméricos en mayúsculas de `COALESCE(NEW.qr_uuid, NEW.codigo_qr)` con el prefijo `'PL-'` (`regexp_replace(..., '[^a-zA-Z0-9]', '', 'g')`), eliminando la generación de UUIDs aleatorios desacoplados del sticker físico.
    - Se actualizaron las filas existentes en `public.palmetas_led` para asegurar que `codigo_visible` coincida 1:1 con el final de su `qr_uuid`.
  - **Alineación en la App Móvil (`palmetas.ts` y `sync.ts`):**
    - Se implementó la función utilitaria `deriveCodigoVisible(qrUuid)` en `mobile/src/core/api/palmetas.ts`.
    - Tanto el aprovisionamiento directo en Modo Ráfaga (`provisionPalmeta`) como la sincronización por lotes de palmetas SQLite (`syncPendingPalmetas` en `sync.ts`) ahora calculan y envían explícitamente `codigo_visible` en el payload de `insert()` hacia `palmetas_led`.
  - **Verificación:**
    - `npx tsc --noEmit` en `/mobile`: **0 errores de compilación**.
    - Consulta SQL de verificación en Supabase: 100% de palmetas registradas con `alineado: true`.

- **2026-10-24 (Sesión 33 — Auditoría QA de Storage HU-12, Sync HU-14 y Corrección Crítica en resolvePalmetaUuid):**
  - **Auditoría de Políticas Storage (RLS):**
    - Verificación del bucket `evidencias-incidencias` (`public: true`) en `storage.buckets`.
    - Verificación de políticas RLS en `storage.objects`: `Lectura de evidencias publicas` (SELECT public) y `Subida de evidencias para usuarios autenticados` (INSERT authenticated).
  - **Corrección Crítica en [sync.ts](file:///c:/Workspace/aleprod-capstone/mobile/src/core/api/sync.ts):**
    - Se detectó que `resolvePalmetaUuid()` consultaba la columna inexistente `numero_serie` (`palmetas_led.numero_serie`). Se corrigió a búsqueda indexada multi-columna con `.or('codigo_qr.eq,qr_uuid.eq,codigo_visible.eq')`, garantizando la resolución exitosa del UUID de palmeta.
    - Soporte ampliado para formatos de imagen en `uploadEvidenceImage`: compatibilidad explícita con `heic`/`heif` (captura iOS) y `blob:` (Web/PWA).
  - **Validación Automatizada Empírica:**
    - Se creó y ejecutó con éxito [mobile/test-upload.mjs](file:///c:/Workspace/aleprod-capstone/mobile/test-upload.mjs): autenticación con `tecnico@aleprod.cl`, subida a Storage `evidencias-incidencias`, validación CDN HTTP 200 con MIME type `image/jpeg` y registro en `public.incidencias` de Supabase Cloud.

- **2026-10-24 (Sesión 32 — Migración Exitosa a Expo SDK 58 y React Native 0.88):**
  - **Actualización de Stack y Dependencias:**
    - Se ejecutó `npx expo install expo@^58.0.0` y alineación automática con `npx expo install --fix`.
    - Dependencias consolidadas: `expo@~58.0.19`, `react@19.3.0`, `react-dom@19.3.0`, `react-native@0.88.0`, `expo-router@~58.0.26`, `expo-camera@~58.0.12`, `expo-sqlite@~58.0.14`, `expo-blur@~58.0.5`, `expo-image-picker@~58.0.10`, etc.
  - **Resolución de Breaking Changes en React Native 0.88 y Expo Router v58:**
    - **`StatusBar`:** En React Native 0.88 se eliminó la propiedad deprecada `backgroundColor` en los tipos de `<StatusBar>`. Se actualizaron 11 pantallas a `<StatusBar barStyle="light-content" />`.
    - **`LiquidGlassTabBar`:** En Expo Router v58 y React Navigation 7, la importación de tipos se migró a `import type { BottomTabBarProps } from 'expo-router/js-tabs'`, tipando `LiquidGlassTabBarProps` con `navigateToTab` nativo y fallback resiliente a `navigation.navigate()`.
    - **Limpieza de CLI:** Se desinstaló `eas-cli` local conforme a la recomendación de Expo para invocarlo vía `npx eas`.
  - **Verificación Exhaustiva:**
    - `npx expo-doctor`: **20/20 verificaciones aprobadas (0 advertencias)**.
    - `npx tsc --noEmit` en `/mobile`: **0 errores de compilación**.
    - Compatibilidad 100% restaurada con la versión más reciente de Expo Go en iPhone/iOS.

- **2026-10-24 (Sesión 31 — Refinamiento RBAC: Rol Coordinador, Bloqueo de Inicio de Eventos en Móvil, Persistencia AsyncStorage y Recuperación de Contraseña):**
  - **Actualización de Base de Datos y RBAC en Supabase Cloud:**
    - Se ejecutó `ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check; ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_rol_check CHECK (rol IN ('tecnico', 'coordinador', 'admin'));`. La base de datos ahora acepta oficialmente el rol `coordinador`.
  - **Refactorización de [AuthContext.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/context/AuthContext.tsx):**
    - Se definieron los tipos `UserRole = 'admin' | 'coordinador' | 'tecnico'` y `UserProfile`.
    - Se implementó persistencia offline del perfil y rol mediante `AsyncStorage` (`@aleprod_user_profile`), permitiendo arranque instantáneo (0ms) en terreno sin red.
    - Se exponen los helpers RBAC: `canStartEvent` (`isAdmin || isCoordinador`), `role`, `isAdmin`, `isCoordinador`, `isTecnico`, `profile` y `refreshProfile()`.
  - **Bloqueo Condicional en [EventsScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/EventsScreen.tsx):**
    - **Admins y Coordinadores:** Visualizan el botón de acción principal "Iniciar Nuevo Evento" en la pestaña "En Curso".
    - **Técnicos:** El botón se oculta por completo y se despliega una tarjeta Dark/Gold corporativa de alta gama (`technicianNoticeCard`) con icono de campana dorada `#D4AF37`, badge "TÉCNICO" y el mensaje: *"Cuando se inicie un evento te aparecerá aquí y se te notificará."*
    - Se adaptó el estado vacío para mostrar instrucciones coherentes al rol del usuario.
  - **Auditoría y Conexión de Persistencia ("Recordarme"):**
    - Auditoría técnica confirmando `AsyncStorage` en `mobile/src/core/api/supabase.ts` con `autoRefreshToken: true` y `persistSession: true`.
    - Conexión del checkbox "Recordarme" en [LoginScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/auth/screens/LoginScreen.tsx) para almacenar y precargar automáticamente el correo del técnico (`@aleprod_saved_email`).
  - **Módulo de Recuperación de Contraseña:**
    - Creación de [ForgotPasswordScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/auth/screens/ForgotPasswordScreen.tsx) conectada a `supabase.auth.resetPasswordForEmail()` con redirección multiplataforma (`aleprod://reset-password` en móvil y origin en web).
    - Registro de ruta en [mobile/app/forgot-password.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/forgot-password.tsx) y en el Stack de [mobile/app/_layout.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/_layout.tsx) habilitando acceso público fuera del guard de sesión.
    - Botón "¿Olvidaste tu contraseña?" de `LoginScreen.tsx` conectado a la nueva ruta mediante `router.push('/forgot-password')`.
  - **Verificación Técnica:** `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-23 (Sesión 30 — Rediseño de ReportIncidentModal, IncidentScannerModal y Disparadores con Swipe-Down y Azul Corporativo):**
  - **Rediseño Completo de [ReportIncidentModal.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/components/ReportIncidentModal.tsx):**
    - **Swipe-to-Dismiss:** Implementado `PanResponder` con `Animated.Value(panY)` en el handle superior y cabecera para arrastrar y descartar el modal hacia abajo fluidamente además del botón `✕`.
    - **Cabecera Ejecutiva:** Icono de herramienta en contenedor circular azul suave (`#60A5FA` / `rgba(37, 99, 235, 0.14)`) y subtítulo de diagnóstico técnico en terreno.
    - **Identificación de Palmeta:** Icono de QR y enlace de escaneo en azul suave (`#60A5FA`). Tarjeta de activo en `#121620` con texto en monoespacio blanco.
    - **Selector de Componentes:** Grid 2x2 actualizado a fondo `#121620`, borde activo `#2563EB`, caja de iconos azul con glifo blanco, checkmark circular azul con check blanco, y labels en blanco `#FFFFFF`.
    - **Evidencia Fotográfica:** Contenedor dashed en `#0F1422` con círculo de cámara en `rgba(37, 99, 235, 0.12)` e icono `#60A5FA`.
    - **Botón Guardar Registro:** Actualizado de amarillo/dorado a gradiente azul oficial `['#2563EB', '#1D4ED8']` con texto e icono en blanco `#FFFFFF` y shadow `#2563EB`.
  - **Actualización de [AssetDetailScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/screens/AssetDetailScreen.tsx):**
    - Botón "Reportar Falla" actualizado de fondo ámbar con texto negro a azul corporativo `#2563EB` con icono y texto en blanco `#FFFFFF`.
  - **Actualización de [EventDetailScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/EventDetailScreen.tsx):**
    - Botón "Reportar Falla en este Evento" actualizado de ámbar a azul suave `#60A5FA` con fondo navy translúcido y borde coordinado.
    - Indicadores de lista y RefreshControl actualizados a azul corporativo `#60A5FA` y `#2563EB`.
  - **Actualización de [IncidentScannerModal.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/components/IncidentScannerModal.tsx):**
    - Esquinas de enfoque de la cámara, botón de linterna activa, botón de permisos y atajo manual actualizados de amarillo ámbar a azul corporativo `#3B82F6` / `#2563EB` / `#60A5FA`.
  - **Verificación:** Tipado validado con `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 29 — Rediseño de StartEventBottomSheet, Swipe-Down y Pantalla Nativa de Notificaciones):**
  - **Rediseño Completo de [StartEventBottomSheet.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/components/StartEventBottomSheet.tsx):**
    - **Erradicación del Ámbar Invasivo:** Iconos de inputs (`calendar-outline`, `location-outline`) cambiados de ámbar a gris pizarra `#94A3B8`. Enlace "Ver frecuentes" a azul corporativo `#60A5FA`.
    - **Servicios en Lenguaje Azul Corporativo:** Selección de Pista LED y Pirotecnia actualizada a borde azul `#2563EB`, fondo navy translúcido `rgba(37, 99, 235, 0.12)`, caja de iconos activa en `#2563EB` con icono blanco, checkbox circular con check en blanco puro `#FFFFFF`, y títulos en blanco `#FFFFFF`.
    - **Botón de Acción Principal:** Sustitución del degradado amarillo/dorado chillón por el azul oficial `#2563EB` (`['#2563EB', '#1D4ED8']`) con tipografía e icono en blanco `#FFFFFF` y sombra azul ambiental.
    - **Icono del Título:** Contenedor circular azul suave `rgba(37, 99, 235, 0.14)` con borde `rgba(59, 130, 246, 0.35)` e icono en `#60A5FA`.
    - **Superficie M²:** Métrica central limpia sobre `#0F1422` con borde neutro sutil, número blanco y unidad gris perla `#94A3B8`. Presets seleccionados en azul corporativo `#2563EB`.
    - **Gesto de Arrastre para Cerrar (Swipe-to-Dismiss):** Implementación de `PanResponder` con `Animated.Value` en el handle superior y cabecera; deslizar hacia abajo con el dedo anima el modal de forma fluida y lo descarta al superar el umbral de arrastre o velocidad.
  - **Creación de Pantalla Dedicada de Notificaciones:**
    - Se creó [NotificationsScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/notifications/screens/NotificationsScreen.tsx) con estética Dark Mode prémium, gradiente superior, filtros por segmentos ("Todas", "Alertas", "Sistema"), botón "Marcar leídas" y estado de bandeja al día.
    - Se registró la ruta en [mobile/app/notifications.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/notifications.tsx) y en el stack de [mobile/app/_layout.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/_layout.tsx).
    - Se reorientaron los botones de campana en [HomeScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/HomeScreen.tsx) y [EventsScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/EventsScreen.tsx) desde `/activity-history` hacia la nueva ruta `/notifications`.
  - **Verificación:** Tipado validado con `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 28 — Estética Minimalista Apple/Linear: Tipografía Neutra y Micro-Indicadores Semánticos):**
  - **Implementación de la Opción B (Estilo Ejecutivo Apple/Linear):**
    - Se eliminó la coloración semántica invasiva en textos completos y números secundarios de las tarjetas.
    - Los conteos numéricos de palmetas (`{operativoCount} palmetas`, `{mantencionCount} palmetas`, `{bajaCount} palmetas`) y los textos de badges (`"Revisión"`, `"Baja"`, `"AL DÍA"`) ahora se presentan en **blanco puro (`#F1F5F9`) y gris perla neutro (`#CBD5E1` / `#E2E8F0`)**.
    - El color semántico se delegó exclusivamente a **micro-indicadores de estado (dots de 5x5px)** y pequeños iconos monocromáticos contenidos.
    - Se neutralizaron las cajas de iconos y badges a fondos oscuros mate de baja opacidad (`rgba(255, 255, 255, 0.04 - 0.05)`) con bordes sutiles (`0.08`), eliminando cualquier sensación de resplandor o saturación artificial en pantallas OLED.
  - **Archivos Modificados:**
    - [HomeScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/HomeScreen.tsx): Cards de equipos con dots semánticos (`statusDotGreen`, `statusDotAmber`, `statusDotRed`), conteos en gris perla, y subtítulos de actividad reciente neutros.
    - [SettingsScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/settings-sync/screens/SettingsScreen.tsx): Badge de registros pendientes con micro-dot semántico y texto neutro.
  - **Verificación:** Tipado validado con `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 27 — Refinamiento Cromático Semántico: Calibración Mate y Sofisticada de Tarjetas e Iconos):**
  - **Eliminación del Efecto Neón Chillón en Cards e Iconos:**
    - Se sustituyeron los colores estridentes y fluorescentes (`#34D399`, `#FBBF24` y `#F87171`) por la paleta semántica oficial mate y refinada ([.ai/03-ui-ux-branding.md](file:///c:/Workspace/aleprod-capstone/.ai/03-ui-ux-branding.md)): **Verde Esmeralda (`#10B981`)**, **Ámbar Cálido (`#F59E0B`)** y **Rojo Coral (`#EF4444`)**.
    - Se ajustaron las opacidades de los contenedores de iconos y micro-badges a un 10% de tinte (`rgba(..., 0.10)`) y 22% de borde (`rgba(..., 0.22)`), erradicando el resplandor artificial que sobreiluminaba en pantallas oscuras.
  - **Armonización de Componentes Afectados:**
    - [HomeScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/HomeScreen.tsx): Card principal de operativos, cards de mantención y baja (badges, números de palmetas, iconos), estado de sincronización en nube y tarjetas de actividad reciente.
    - [SettingsScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/settings-sync/screens/SettingsScreen.tsx): Sub-card de registros pendientes de sincronización (icono de nube y badge de conteo).
    - [EventsScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/EventsScreen.tsx): Badges de estado de eventos planificados.
    - [ScannerScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/screens/ScannerScreen.tsx): Botones de cierre con rojo coral sobrio `#EF4444`.
  - **Verificación:** Tipado validado con `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 26 — Refactorización de Nomenclatura: Limpieza a LiquidGlassTabBar):**
  - **Eliminación de Nomenclatura Externa:** Se removió la palabra `"Instagram"` de todo el código fuente, renombrando el componente y archivo a [LiquidGlassTabBar.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/components/LiquidGlassTabBar.tsx) (`export const LiquidGlassTabBar` y `export default LiquidGlassTabBar`).
  - **Actualización de Referencias:** Se actualizaron las importaciones en [mobile/app/(tabs)/_layout.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/%28tabs%29/_layout.tsx) y comentarios de arquitectura en [mobile/src/core/constants/navigation.ts](file:///c:/Workspace/aleprod-capstone/mobile/src/core/constants/navigation.ts).
  - **Limpieza de Archivos:** Se purgó el archivo obsoleto `InstagramLiquidGlassTabBar.tsx`.
  - **Verificación:** `npx expo-doctor` con **21/21 verificaciones aprobadas** y `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 25 — Optimización de Rendimiento a 120 FPS y Física de Rebote Elástica con Bounciness/Speed en TabBar):**
  - **Eliminación de la Causa Raíz del Lag (Stutter):**
    - Se descubrió que en cada evento de arrastre (`onPanResponderMove`), se invocaba `setDragHoverIndex`, forzando decenas de re-renderizados pesados de React por segundo en el hilo JS justo mientras el usuario interactuaba.
    - Se eliminó `setDragHoverIndex` del bucle de arrastre: ahora `indicatorX.setValue(newPos)` opera de manera continua directamente en el hilo UI nativo con **0 re-renders de React**, logrando fluidez pura a 60/120 FPS.
    - Se eliminó el resorte en conflicto en `onPanResponderGrant`, evitando que un tap rápido lance dos resortes con tensiones diferentes en menos de 50ms.
    - Se deduplicó la ejecución del resorte en `useEffect` con la referencia `lastAnimatedTargetX`, impidiendo que el re-render de Expo Router aborte e interrumpa el resorte en pleno vuelo.
  - **Física de Resorte Apple de Alta Elasticidad:**
    - Se configuraron los parámetros nativos de UIKit / Pop: `bounciness: 12` y `speed: 16` con `useNativeDriver: true`. Esto genera una aceleración instantánea y enérgica, acompañada de un sutil sobrepaso (*overshoot*) y rebote gomoso natural sin sensación pesada o trabada.
    - Se activó aceleración por GPU (`shouldRasterizeIOS` y `renderToHardwareTextureAndroid`) en el `<Animated.View>` del selector activo.
  - **Verificación:** `npx expo-doctor` con **21/21 verificaciones aprobadas** y `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 24 — Calibración Geométrica Compacta: Cápsula Estilizada a 58px y Botón QR Isométrico):**
  - **Homogeneización Isométrica (Altura Uniforme):** Se configuraron `CAPSULE_HEIGHT = 58` y `BUTTON_SIZE = 58`. Con esto, el botón circular de escaneo QR y la cápsula flotante comparten exactamente la misma cota vertical, eliminando la sensación visual de que el botón era desproporcionado o más grande que la barra.
  - **Perfil Compacto y Fino:**
    - Altura de la cápsula reducida de 66px a **58px** (`borderRadius: 29`).
    - Altura del selector interior activo ajustada a **48px** (`INDICATOR_HEIGHT = 48`), manteniendo márgenes verticales simétricos de 5px.
    - Ancho de la cápsula optimizado a **260px** (`MAX_CAPSULE_WIDTH = 260`) para una distribución espaciosa pero contenida en pantallas de 360-430px.
    - Tipografía de etiquetas ajustada a `10px` con `marginTop: 1.5` y tamaño de iconos en pestañas a `20.5px`.
    - Icono de escáner QR calibrado a `24px` en `#FFFFFF` para armonizar con la nueva escala.
  - **Verificación:** `npx expo-doctor` con **21/21 verificaciones aprobadas** y `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 23 — Corrección de Stale Closures en PanResponder, Sincronización Optimista y Precisión de Límites en TabBar):**
  - **Diagnóstico de los Bugs Reportados:**
    1. *Desync de Navegación (Burbuja se mueve a Inicio pero la pantalla queda en Ajustes):* `useRef(PanResponder.create(...))` capturaba el objeto `state` en un *stale closure* desde el primer render (`state.index = 0`). Al navegar a Ajustes (`index = 2`) y luego pulsar Inicio (`finalIndex = 0`), la comprobación `isFocused = state.index === finalIndex` evaluaba erróneamente `0 === 0` (`true`), creyendo que Inicio ya estaba activo y omitiendo el disparo de `navigation.navigate('index')`.
    2. *Cancelación y Retorno Inesperado al Deslizar:* `onPanResponderTerminationRequest` no estaba definido (por defecto `true`), provocando que cualquier leve movimiento vertical o reclamo del contenedor padre terminara abruptamente el gesto (`onPanResponderTerminate`).
    3. *Desfase de Medio Casillero:* El cálculo de tab usaba `Math.round(centerPos / itemWidth)` sobre una posición central ya compensada, redondeando al casillero superior y causando saltos erráticos entre pestañas.
  - **Solución Implementada ([InstagramLiquidGlassTabBar.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/components/InstagramLiquidGlassTabBar.tsx)):**
    - **Refs de Estado Fresco:** Se desacoplaron `state`, `navigation`, `itemWidth`, `tabCount`, `minX` y `maxX` en `useRef` actualizados en cada render (`stateRef.current`, `navigationRef.current`, etc.), garantizando que los callbacks gestuales siempre lean el estado real e inmediato de navegación.
    - **Protección contra Terminación:** `onPanResponderTerminationRequest: () => false`, `onStartShouldSetPanResponderCapture: () => true` y `onMoveShouldSetPanResponderCapture: () => true`, blindando el arrastre horizontal contra interrupciones de ScrollViews.
    - **Matemática Exacta de Límites:** Se sustituyó por `Math.floor(centerPos / currentItemWidth)`, garantizando que el punto de transición coincida exactamente con el centro geométrico entre pestañas.
    - **Estado Optimista (`optimisticIndex`):** Al soltar el dedo o hacer tap, `effectiveIndex` actualiza inmediatamente el resaltado en blanco del texto e icono seleccionado antes de que Expo Router complete la transición de estado, eliminando cualquier parpadeo visual.
  - **Verificación:** `npx expo-doctor` con **21/21 verificaciones aprobadas** y `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 22 — Seguimiento Gestual Táctil con PanResponder y Translucidez Liquid Glass Real en TabBar):**
  - **Seguimiento Continuo del Dedo (Scrubbing / Pan Tracking):** Implementación de gestos nativos de alta fidelidad con `PanResponder` de React Native sin librerías externas.
    - `onPanResponderGrant`: Detecta la posición X del toque y lanza una animación elástica rápida que centra el selector bajo el dedo, identificando la pestaña inicial y disparando feedback háptico (`light`).
    - `onPanResponderMove`: A medida que el usuario arrastra el dedo horizontalmente, el selector se mueve de forma continua en tiempo real (`indicatorX.setValue(newPos)`), restringido de forma elástica a los márgenes interiores de la cápsula. Al cruzar los límites de una pestaña a otra, se actualiza el estado de previsualización activa (`dragHoverIndex`) y se emite un micro-tick háptico (`selection`).
    - `onPanResponderRelease`: Discrimina entre toque simple (tap rápido sin arrastre) y deslizamiento continuo. Calcula magnéticamente la pestaña más cercana al punto de suelta, ejecuta un anclaje elástico `Animated.spring` (`tension: 70, friction: 8, useNativeDriver: true`) hacia el casillero destino y dispara la navegación en Expo Router junto a feedback háptico (`medium`).
  - **Translucidez Real Liquid Glass (Frosted Glass Depth):**
    - Se eliminó el fondo opaco `#0F1422` que bloqueaba la visibilidad en `capsuleWrapper`, configurando `backgroundColor: 'transparent'` en iOS (y semi-translúcido en Android).
    - Se redujo la capa de tinte en `glassOverlay` de 78% a 42% de opacidad (`rgba(10, 15, 28, 0.42)`), permitiendo que el contenido de la pantalla (scroll, tarjetas, texto) se aprecie nítidamente desenfocado por detrás de la barra.
    - Se incrementó la intensidad del desenfoque a 70 en `BlurView` (`expo-blur`) para un look esmerilado de alta gama con legibilidad impecable.
  - **Verificación:** `npx expo-doctor` con **21/21 verificaciones aprobadas** y `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 21 — Resolución de TypeError en Reanimated y Estabilización con React Native Native-Driver Animated.spring en TabBar):**
  - **Diagnóstico del Error:** En Expo SDK 57 / React Native 0.86, la importación de `react-native-reanimated` v4.5.1 generaba un crasheo en evaluación de módulo (`TypeError: Cannot read property 'code' of undefined`) en Expo Go debido a incompatibilidad en el runtime C++/worklets y transformación de Babel. Este fallo impedía la evaluación de `InstagramLiquidGlassTabBar`, ocasionando a su vez el fallo en cascada de Expo Router (`Ensure a React component is exported as default` y `TypeError: Cannot read property 'ErrorBoundary' of undefined` en `_layout.tsx`).
  - **Sustitución por `Animated` Nativo:** Se reemplazó `react-native-reanimated` en [InstagramLiquidGlassTabBar.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/components/InstagramLiquidGlassTabBar.tsx) por el módulo `Animated` nativo de React Native con `useNativeDriver: true`.
  - **Física de Rebote Idéntica:** Se implementó `Animated.spring(indicatorX, { toValue: targetX, tension: 70, friction: 8, useNativeDriver: true })`, logrando la misma aceleración fluida y sutil rebote elástico a 60/120 FPS directo en el hilo UI nativo sin latencia del hilo JS ni dependencias nativas inestables.
  - **Limpieza de Dependencias:** Se desinstalaron `react-native-reanimated` y `react-native-worklets` de `mobile/package.json` para evitar que Metro ejecute transformaciones innecesarias de Babel.
  - **Exportación Dual Robusta:** Se garantizó tanto la exportación nombrada (`export const InstagramLiquidGlassTabBar`) como por defecto (`export default InstagramLiquidGlassTabBar`) para resiliencia total ante imports de Expo Router.
  - **Verificación de Tipos:** Validación estricta con `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 20 — Rediseño Premium de la Barra de Navegación Inferior: Estilo Instagram Liquid Glass con Spring Reanimated):**
  - **Inspección Técnica de Stack:** Expo SDK 57 (`~57.0.31`), React 19.2.3, React Native 0.86.3, Expo Router `~57.0.29`, TypeScript 6.0.3.
  - **Evaluación y Descarte de `expo-glass-tabs`:** Se analizó el paquete `expo-glass-tabs` (v0.1.1); fue descartado debido a su rigidez de diseño (asume pantalla completa forzada `windowWidth - 24`), incompatibilidad para ubicar el botón QR circular independiente al lado, dependencia forzosa de `useMinimizeOnScroll` en cada pantalla, uso exclusivo de `expo-glass-effect` en iOS 26+ sin desenfoque en Android, y alteración invasiva de la arquitectura a `expo-router/ui`.
  - **Implementación Propia Premium ([InstagramLiquidGlassTabBar.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/components/InstagramLiquidGlassTabBar.tsx)):**
    - Cápsula flotante con esquinas completamente redondeadas (`borderRadius: 33`, altura 66 px).
    - Fondo de cristal oscuro `rgba(12, 17, 31, 0.78)` con desenfoque nativo real vía `BlurView` (`expo-blur`), fallback sólido `#0F1422` para máxima compatibilidad multiplataforma (iOS y Android), y borde fino `rgba(255, 255, 255, 0.12)`.
    - Selector activo interior translúcido (`rgba(91, 112, 158, 0.35)`) con **animación elástica tipo spring (`react-native-reanimated`)** (`damping: 14`, `stiffness: 140`, `mass: 0.8`) con sutil rebote natural al cambiar de pestaña.
    - Sombra ambiental difusa y discreta (`shadowColor: '#000000'`, `shadowOpacity: 0.38`, `shadowRadius: 14`).
    - Iconografía minimalista con feedback háptico (`light`), estado activo en blanco puro (`#FFFFFF`) e inactivo en gris suave (`#9AA8C1`).
    - Botón de escaneo QR independiente (56 px) en azul corporativo (`#2563EB`) integrado simétricamente con holgura al lado de la cápsula.
  - **Neutralización de `TAB_OFFSET` ([navigation.ts](file:///c:/Workspace/aleprod-capstone/mobile/src/core/constants/navigation.ts)):** Se ajustó `TAB_OFFSET = 0`, eliminando el antiguo desplazamiento de UIKit y permitiendo que todas las pantallas se extiendan 100% simétricas sin alterar su lógica interna.
  - **Integración Nativa Expo Router ([_layout.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/%28tabs%29/_layout.tsx)):** Conexión con `<Tabs tabBar={(props) => <InstagramLiquidGlassTabBar {...props} />}>`, preservando las rutas `index`, `eventos` y `ajustes`, el ciclo de vida y el botón atrás en Android.
  - **Verificación Rigurosa:** `npx expo-doctor` con **21/21 verificaciones aprobadas**, `npx expo install --check` con dependencias al día, y `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 19 — Refinamiento de Cabecera: Eliminación de Glow en Avatar y Subtítulo Sutil):**
  - **Eliminación de Glow en Avatar "AP":** Se retiraron las propiedades de sombra y halo azul (`shadowColor: '#2563EB'`, `shadowOffset`, `shadowOpacity`, `elevation`) de `avatarCircle` en `HomeScreen.tsx`, reemplazándolas por un acabado mate limpio con borde sutil (`borderWidth: 1`, `borderColor: 'rgba(255, 255, 255, 0.12)'`).
  - **Subtítulo "Aleprod Terreno" Más Pequeño y Sutil:** Se ajustó la tipografía de `headerOrgText` en `HomeScreen.tsx` (así como en `EventsScreen.tsx` y `SettingsScreen.tsx`), pasando a `fontSize: 11` (desde 12), tono Slate 500 (`#64748B`), `letterSpacing: 0.2` y `fontWeight: '500'`, logrando una jerarquía visual más sobria y balanceada.
  - **Homogeneización Global:** Se extendió el mismo acabado limpio sin sombras residuales a los identificadores circulares de `EventsScreen.tsx` (`calendarIconCircle`) y `SettingsScreen.tsx` (`gearIconCircle`).
  - **Validación de Tipos:** `npx tsc --noEmit` en `/mobile` ejecutado con éxito (**0 errores**).

- **2026-10-22 (Sesión 18 — Corrección de Tabs, Botón QR Azul Corporativo sin Neón y Armonización Visual):**
  - **Eliminación del Tono Dorado en Tabs:** Se reemplazó el color amarillo/dorado (`#FACC15`) por **blanco puro (`#FFFFFF`)** en la pestaña activa (`tintColor`, `selected: "#FFFFFF"`), con gris sutil (`#71717A`) para las inactivas.
  - **Botón de Escaneo QR en Azul Corporativo:** Sustitución del fondo amarillo chillón por el **azul oficial `#2563EB`** con icono de QR en blanco (`#FFFFFF`).
  - **Eliminación del Brillo/Glow Neón:** Se removió la sombra coloreada con halo neón (`shadowColor: SOFT_YELLOW`), sustituyéndola por una sombra sutil oscura estándar (`#000000`, `shadowOpacity: 0.35`, `shadowRadius: 5`).
  - **Restauración Geométrica del Tabs Pill:** Se calibró la denominación armónica `"Ajustes"` (7 letras, estándar Apple en español) tanto en `<Label>Ajustes</Label>` como en `SettingsScreen.tsx`, eliminando el desbordamiento y colisión visual que provocaban las 13 letras de `"Configuración"`. Con esto, la cápsula de Liquid Glass y el botón flotante quedan perfectamente alineados con holgura simétrica.
  - **Validación de Tipos:** `npx tsc --noEmit` en `/mobile` ejecutado con éxito (**0 errores**).

- **2026-10-22 (Sesión 17 — Rediseño de Configuración y Unificación de Pestaña con Icono de Tuerca):**
  - **Unificación de Identidad ("Configuración"):** Se sincronizó la denominación entre la barra de navegación `<NativeTabs>` (`mobile/app/(tabs)/_layout.tsx`) y el módulo de pantalla, sustituyendo la etiqueta desfasada `"Ajustes"` por `"Configuración"`.
  - **Icono de Tuerca en Pestaña:** Actualización del disparador nativo en iOS con SF Symbol `gearshape` (default) / `gearshape.fill` (selected), manteniendo el icono Material `settings` para compatibilidad.
  - **Cabecera Limpia y Minimalista:** Implementación en `SettingsScreen.tsx` de una cabecera nativa con logo circular de tuerca de 44x44px (`#2563EB`, sombra azul, `settings-outline` en blanco), subtítulo `"Aleprod Terreno"` (12px, `#94A3B8`) y título `"Configuración"` (22px, `#FFFFFF`, `fontWeight: '800'`). Sin botones adicionales en la derecha conforme a la instrucción expresa.
  - **Línea Visual Dark Navy y Halo Ambiental:** Fondo unificado `#080C14`, halo superior suave con `<LinearGradient>` (`height: 320`, tonos `rgba(29, 78, 216, 0.35)` a transparente), tarjetas elevadas en `#121620`, micro-badges calibrados, botón de sincronización principal en azul eléctrico `#2563EB` y lista de opciones limpia.
  - **Validación de Tipos:** `npx tsc --noEmit` en `/mobile` ejecutado con éxito (**0 errores**).

- **2026-10-22 (Sesión 16 — Rediseño del Módulo de Eventos con Lenguaje Dark Navy y Header Limpio):**
  - **Alineación Visual con Inicio (HomeScreen):** Adopción de la paleta Dark Navy (`#080C14` de fondo, tarjetas en `#121620` con bordes sutiles `rgba(255, 255, 255, 0.07)`), halo ambiental superior continuo con `<LinearGradient>` (`height: 320`, tonos `rgba(29, 78, 216, 0.35)` a transparente) y descompresión superior con `insets.top + 16`.
  - **Cabecera con Logo de Calendario:** Reemplazo de la antigua cabecera flotante por una cabecera nativa con contenedor circular de 44x44px (`#2563EB` con elevación y halo azul) portando el icono `calendar-outline` en blanco, preservando la identidad del módulo.
  - **Identidad de Título Diferenciada:** En lugar del saludo del Home ("Hola, Técnico"), se definió el título institucional: Subtítulo `"Aleprod Terreno"` (12px, `#94A3B8`) y Título `"Agenda de Eventos"` (22px, `#FFFFFF`, `fontWeight: '800'`).
  - **Botón de Campana Limpio:** Integración del botón circular de campana (`notifications-outline` en `#CBD5E1`) enlazado a la ruta `/activity-history` con respuesta háptica, eliminando completamente el badge numérico que ocupaba espacio en el header.
  - **Selector de Segmentos y Botón de Inicio:** Segmentos "En Curso" e "Historial" estilizados con fondo navy `#121620`, activo en azul eléctrico `#2563EB` con badges de conteo embebidos. Botón CTA "Iniciar Nuevo Evento" con tarjeta navy, icono plus con brillo azul y chevron discreto.
  - **Tarjetas de Eventos y Micro-Badges:** Estado del evento (`MONTAJE EN CURSO`, `PLANIFICADO`, `FINALIZADO`) con micro-badges compactos (padding 7x2.5px, dot de 4x4px), píldora de fechas sutil, ficha técnica en `#0F131D` y barra de progreso de m² sobre pista `#1E293B`.
  - **Cero Mocks:** Mapeo verídico desde Supabase `eventos` sin inyectar datos simulados de fallback en el estado reactivo.
  - **Validación de Tipos:** `npx tsc --noEmit` en `/mobile` ejecutado con éxito (**0 errores**).

- **2026-10-22 (Sesión 15 — Calibración Visual y Sincronización Real sin Mock):**
  - **Depuración de Evento Activo Semilla en Supabase:** Actualización del evento residual `"Festival Estadio Nacional"` a `estado = 'planificado'` en Supabase Cloud (`fovmurimpbexfrjwxdew`), ya que nunca había sido iniciado por el técnico.
  - **Sincronización Local SQLite (`eventos_locales`):** Implementación de rutina de reseteo garantizado `clean_mock_active_events_v2` en `initDB()` (`mobile/src/core/db/database.ts`) y nuevo helper `clearAllLocalActiveEvents()`. `HomeScreen.tsx` ahora verifica con Supabase y limpia cualquier estado local si no existen eventos activos, mostrando de manera verídica la tarjeta compacta `"Sin Montaje Activo"` con acceso a la agenda.
  - **Rediseño Compacto de Badges en Card Activo:** Ajuste de tamaño y proporciones en `activeTag` y `locationPill`: reducción a formato micro-badge (`paddingHorizontal: 7`, `paddingVertical: 2.5`, `borderRadius: 6`), punto de estado de 4x4px, tipografía contenida (9.5px y 10.5px) y limitación a 52% de ancho máximo para evitar cualquier choque o desalineación visual.
  - **Ambient Glow Suave con `<LinearGradient>`:** Sustitución del contenedor con `borderRadius: 110` por `<LinearGradient>` (`expo-linear-gradient`) con desvanecimiento vertical continuo hacia abajo, eliminando cualquier borde duro.
  - **Cabecera Limpia y Feedback en Icono de Nube:** Eliminación del texto `"• Sincronizado"` del subtítulo. El estado de sincronización se traslada al botón de la nube mediante icono condicional (`cloud-done-outline` en verde `#34D399` vs `cloud-upload-outline` en ámbar `#FBBF24`) junto a un micro-punto indicador.
  - **Calibración Geométrica en "Estado de Equipos":** Ajuste de proporciones en `mainStatusCard` y la cuadrícula `gridCard`: tipografías proporcionales (24px y 20px), alineación vertical precisa entre el icono y los badges `"Revisión"` / `"Baja"`, y formato gramatical singular/plural (`1 palmeta` vs `X palmetas`).
  - **Botón Cápsula "Ver historial":** Transformación del enlace de texto plano en un botón interactivo tipo badge/cápsula con icono de reloj `time-outline`, texto `"Ver historial"` y chevron indicador.
  - **Espaciado y Descompresión Superior:** Incremento del padding superior (`insets.top + 16`), extensión del resplandor ambiental a 320px de altura y mayor separación inferior del header (`paddingBottom: 18`) para otorgar holgura visual respecto a los indicadores de barra de estado y tarjetas.
  - **Validación de Compilación:** `npx tsc --noEmit` en `/mobile` ejecutado con éxito (**0 errores**).

- **2026-10-22 (Sesión 14 — Ajuste y Depuración: 0 Incidencias Iniciales y 2 Palmetas Vivas):**
  - **Auditoría de Datos en Supabase Cloud:** Verificación estricta de tablas en Supabase (`fovmurimpbexfrjwxdew`): la tabla `incidencias` contiene **0 registros** y `palmetas_led` contiene exactamente **2 palmetas activas** (`TEST-QR-001` y `ALEP-TEST-1792637164994`, ambas en estado `operativo` y lote `LOTE-102026`). Se preservan intactas tal como fue instruido.
  - **Limpieza de Persistencia Local SQLite:** Implementación en `initDB()` (`mobile/src/core/db/database.ts`) de una rutina de migración garantizada mediante `meta_app` que ejecuta `DELETE FROM incidencias_locales` y `DELETE FROM palmetas_pendientes` para purgar cualquier registro residual generado en pruebas de desarrollo previas, dejando el dispositivo local en 0 incidencias.
  - **Exportación de Funciones de Reseteo:** Nuevos helpers exportados `clearAllLocalIncidencias()` y `clearAllPendingPalmetas()` en `database.ts`, vinculados a una nueva opción interactiva en `SettingsScreen.tsx` ("Restablecer Datos Locales") con confirmación por alerta destructiva.
  - **Depuración de Mockups Residuales en `AssetDetailScreen.tsx`:** Eliminación del mockup estático de incidencia ("Cambiado cable de poder") y contadores fijos. Conexión del detalle a `fetchHybridIncidents` y consulta directa a Supabase `palmetas_led` para obtener lote y estado real. Implementación de estado vacío amigable con escudo verde ("Sin incidencias reportadas / Este módulo se encuentra operativo") cuando la palmeta no registra fallas.
  - **Alineación de Escáneres de Prueba:** Actualización de `IncidentScannerModal.tsx` para simular lecturas utilizando exclusivamente los QR reales existentes en Supabase (`TEST-QR-001` o `ALEP-TEST-1792637164994`).
  - **Optimización UI en `HomeScreen.tsx`:**
    - Rediseño del enlace de historial: transformación del texto plano `"Historial >"` en un badge/botón interactivo elevado (`historyButtonBadge`) con fondo ámbar translúcido, borde dorado suave, icono de reloj `time-outline` y chevron indicador.
    - Rediseño de la tarjeta de montaje inactivo: transformación de `noActiveMountCard` en un contenedor `TouchableOpacity` directamente cliqueable en su totalidad (conduce a la agenda de eventos). Eliminación del divisor interno y del botón amarillo inferior (`goToEventsButton`), ahorrando más de 50px de espacio vertical con una disposición horizontal compacta y badge `"Agenda >"`.
  - **Verificación de Tipos:** Validación estricta con `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 13 — Métricas Dinámicas de Inventario, Actividad Reciente y Pantalla de Historial en Móvil):**
  - **Métricas Dinámicas en `HomeScreen.tsx`:** Eliminación de datos estáticos (`70 m²`, `15 m²`, `140 palmetas`, etc.). Conexión reactiva a Supabase `palmetas_led` con cálculo automático de área según estándar Aleprod (1 palmeta = 0.25 m² para pantallas P3.9 de 50x50cm). Visualización de m², palmetas y porcentajes dinámicos en tarjetas operativas, en mantención y dadas de baja.
  - **Actividad Reciente Real:** Eliminación de tarjetas mockup (`#A45`, `#B12`). Consulta híbrida de las últimas 3 incidencias registradas en Supabase Cloud y SQLite local mediante `fetchHybridIncidents({ limit: 3 })`, mapeadas con iconos y colores semánticos (rojo para baja, ámbar para revisión/falla, verde para operativa).
  - **Nueva Pantalla de Historial (`ActivityHistoryScreen.tsx`):** Creación de vista dedicada y ruta Expo Router `/activity-history` registrada en el Stack principal. Botón "Historial >" de la Home conectado con navegación y feedback háptico.
  - **Filtros por Evento y Búsqueda en Vivo:** Selector tipo Dropdown (Modal Bottom Sheet) para aislar eventos cómodamente sin scrolls horizontales infinitos, complementado con una barra de búsqueda en tiempo real (por QR, código visible, tipo de falla o descripción).
  - **Servicios Modulares:** Nuevos métodos en `mobile/src/core/api/palmetas.ts` (`fetchInventoryMetrics`, `palmetasToM2`, `formatM2`) y creación de `mobile/src/core/api/incidencias.ts` (`fetchHybridIncidents`, `fetchFilterEvents`).
  - **Verificación de Tipos:** Validación estricta con `npx tsc --noEmit` en `/mobile` con **0 errores**.

- **2026-10-22 (Sesión 9 — HU-08: Módulo de Palmetas LED en Web):**
  - Implementación completa de `web/app/palmetas/page.tsx` (Client Component) con queries en tiempo real a la tabla `palmetas_led` de Supabase Cloud.
  - KPIs de parque: Total, Operativas, En Taller (Mantención + Reparación), De Baja.
  - Tabla ejecutiva con filtros por estado semántico (tabs Todas/Operativas/En Taller/Baja) y buscador por código visible, UUID y lote.
  - Modal de ficha técnica con grid de metadatos, selector de nuevo estado operativo (4 opciones) y selector de ubicación post-cambio.
  - Actualización directa en Supabase con `UPDATE palmetas_led SET estado, ubicacion_actual, updated_at`.
  - Actualización del Dashboard (`web/app/page.tsx`): KPI card de Palmetas ahora es un `<Link>` a `/palmetas`; botón "Inventario Palmetas" en Accesos Rápidos también enlaza a `/palmetas`.
  - Verificación exitosa: `GET /palmetas 200` en Turbopack, compilación sin errores, ruta protegida por middleware de sesión.

- **2026-10-22 (Sesión 9 — Activación de Datos Reales en Incidencias y Sincronización Web/Móvil):**
  - **Supabase Cloud:** Sembrado de registros iniciales reales en `public.incidencias` vinculados a las palmetas existentes (`PL-AF69C8` y `PL-6D3FFA`), al evento `Festival Estadio Nacional` y a técnicos registrados. Creación de clave foránea `incidencias_perfiles_fkey`.
  - **Trigger de Coherencia Automática:** Creada función y trigger PostgreSQL `tr_sync_incidencia_palmeta_estado` en `public.incidencias` con `SECURITY DEFINER`.
  - **Módulo Web (`/palmetas` e `/incidencias`):** Actualizados filtros, KPIs y modales para reflejar los 2 estados directos: Operativa y En Mantención.
  - **Diseño y Estética Web:** Dashboard ([web/app/page.tsx](file:///c:/Users/lucas/Downloads/Panel%20ALE/aleprod-capstone/web/app/page.tsx)) unificado a la paleta Dark Luxury OLED (`#0A0A0A`) con sidebar fijo a la izquierda.
  - **Módulo de Eventos y Producciones:** Creado componente interactivo `EventosSection` y módulo dedicado `/eventos` ([web/app/eventos/page.tsx](file:///c:/Users/lucas/Downloads/Panel%20ALE/aleprod-capstone/web/app/eventos/page.tsx)).
  - **Supabase Realtime:** Se añadieron las tablas `palmetas_led`, `incidencias` y `eventos` a la publicación `supabase_realtime` de PostgreSQL.

- **2026-10-21 (Sesión 12 — Aprovisionamiento Masivo en Modo Ráfaga HU-13 en Móvil):**
  - Implementación del servicio `mobile/src/core/api/palmetas.ts`: inserción de palmetas con `codigo_qr`, `estado = 'operativo'`, `lote_ingreso` dinámico.
  - Creación de tabla local SQLite `palmetas_pendientes` con helpers (`insertPendingPalmeta`, `getPendingPalmetas`, `getPendingPalmetasCount`, `markPalmetaAsSynced`).
  - Actualización del esquema Supabase Cloud en `palmetas_led`: columnas `codigo_qr` y `lote_ingreso`, índice único, trigger `tr_sync_palmeta_fields` y política RLS para inserción autenticada.
  - Refactorización de `ScannerScreen.tsx`: integración de aprovisionamiento continuo con banner toast rápido no bloqueante.

- **2026-10-21 (Sesión 11 — Motor de Sincronización Real y Supabase Storage HU-12 y HU-14 en Móvil):**
  - Implementación del servicio de sincronización por lote `mobile/src/core/api/sync.ts` (`syncPendingIncidencias`).
  - Carga de imágenes locales a Supabase Storage bucket `evidencias-incidencias`.
  - Batch INSERT en la tabla `incidencias` de Supabase con resolución resiliente de claves foráneas.

- **2026-10-21 (Sesión 10 — Ciclo de Vida de Eventos HU-16 en Móvil):**
  - Conexión de `HomeScreen.tsx` con el evento real activo (`estado = 'en_curso'`).
  - Implementación de `EventDetailScreen.tsx` con modo Read-Only tras cierre.
  - Pestañas "En Curso" e "Historial" en `EventsScreen.tsx`.

- **2026-10-21 (Sesión 9 — Despliegue DDL en Supabase Cloud y Conexión HU-05 Móvil):**
  - Conexión al proyecto activo `Aleprod` (`fovmurimpbexfrjwxdew`, región `sa-east-1`).
  - Creación de credenciales reales `EXPO_PUBLIC_` en `mobile/.env`.
  - Inyección del esquema relacional DDL completo en PostgreSQL.

- **2026-10-19 (Sesión 8 — Estabilización de Entorno y Dependencias Móviles):**
  - Actualización de runtime Node.js del sistema a **v22.23.2 LTS** y configuración de `RemoteSigned` en PowerShell.
  - Corrección de dependencias faltantes en `/mobile`: instalación limpia de `expo-router`, `@expo/vector-icons`, etc.
  - Creación de `mobile/.npmrc` con `legacy-peer-deps=true` para prevenir bloqueos por peer dependencies en npm.
  - Instalación de dependencia nativa faltante `expo-font` y alineación de paquetes con `npx expo install --fix`.
  - Verificación de salud completa con `npx expo-doctor` (**21/21 checks passed**) y chequeo de tipos estricto con `npx tsc --noEmit` (**0 errores**).

- **2026-10-15 (Sesión 7 — Auditoría de QA y Corrección de Estado):**
  - Auditoría exhaustiva archivo por archivo del código real en `/mobile` y `/web`.
  - Corrección de estados de HUs en `ROADMAP.md`: HU-10, HU-11, HU-12, HU-13 pasan de `[Completada]` a `[En Progreso: UI Lista / Falta integración Supabase]`.
  - Identificación de que Supabase nunca ha sido configurado con credenciales reales (`.env` con placeholders).
  - Identificación de sincronización simulada con `setTimeout` en SettingsScreen.
  - Identificación de datos hardcodeados (métricas m², eventos, historial) en HomeScreen y EventsScreen.
  - Web confirmada como boilerplate intacto de create-next-app.
  - Actualización de la Memoria Viva para reflejar estado honesto.

- **2026-10-14 (Sesión 6 — Migración a Expo Router y Bottom Tabs Nativos con `<NativeTabs>`):**
  - Instalación de dependencias del ecosistema Expo Router en `/mobile`: `expo-router`, `expo-linking`, `expo-constants`.
  - Configuración de `"main": "expo-router/entry"` en [package.json](file:///c:/Workspace/aleprod-capstone/mobile/package.json), `"scheme": "aleprod"` y plugin `"expo-router"` en [app.json](file:///c:/Workspace/aleprod-capstone/mobile/app.json).
  - Creación de [AuthContext.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/context/AuthContext.tsx) para desacoplar el estado de autenticación y permitir `devBypass` transparente en desarrollo.
  - Creación de la cáscara de navegación modular en `mobile/app/`.
  - Verificación estricta de compilación con `npx tsc --noEmit` en `/mobile` (0 errores).
