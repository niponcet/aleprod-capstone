# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 22 de Octubre de 2026.
- **Fase del Proyecto:** **Fase 3 (Desarrollo Núcleo App/Web)** — Monorepo completo con Mobile (offline-first, sync con Supabase Cloud y Storage) y Web (Dashboard, Login, Palmetas, Eventos, Incidencias conectados en tiempo real).
- **Sprint Activo:** Épica 1 (HU-05 y HU-06 Completadas en Web y Móvil), Épica 2 (HU-07 y HU-08 Completadas en Web), Épica 3 (HU-10, HU-11, HU-12, HU-13 y HU-16 Completadas en Móvil), Épica 4 (HU-14 y HU-15 Completadas).
- **Salud del Monorepo:** Tipado limpio (`npx tsc --noEmit` exitoso en `/mobile` y `/web` con 0 errores). Servidor Next.js activo con HTTP 200 y Expo Router con `<NativeTabs>`.
- **Credenciales Cloud:** `mobile/.env` y `web/.env.local` configurados con proyecto activo de Supabase (`fovmurimpbexfrjwxdew`). Base de datos relacional PostgreSQL con RLS, triggers y storage bucket `evidencias-incidencias` activos y verificados.

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
