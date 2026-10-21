# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 21 de Octubre de 2026 (Sesión 11 — Motor de Sincronización Real y Supabase Storage HU-12 y HU-14).
- **Fase del Proyecto:** **Fase 3 (Desarrollo Núcleo App/Web)** — Motor de sincronización offline-first activo con subida de fotos a Storage y lote a PostgreSQL, ciclo de vida de eventos y persistencia híbrida SQLite/Supabase.
- **Sprint Activo:** Épica 1 (HU-05 Móvil Completado), Épica 3 (HU-10, HU-12 y HU-16 Completadas en móvil), Épica 4 (HU-14 y HU-15 Completadas).
- **Salud del Monorepo:** Tipado limpio (`npx tsc --noEmit` exitoso en `/mobile`). Navegación con **Expo Router** y `<NativeTabs>` (Liquid Glass iOS).
- **Credenciales Cloud:** `mobile/.env` configurado con proyecto activo de Supabase (`fovmurimpbexfrjwxdew`). Base de datos relacional PostgreSQL con RLS y storage bucket `evidencias-incidencias` activos y verificados vía pruebas automatizadas.

---

## 2. Historias de Usuario (HUs) — Estado de Avance AUDITADO

### Fase 2: Arquitectura y Configuración Cloud (Completada — Infraestructura Base)
- ✅ **HU-01: Infraestructura Base** `[Completada — Supabase Cloud Desplegado]`
- ✅ **HU-02: Inicialización App Móvil y Escaneo Offline** `[Completada]`
- ✅ **HU-03: Inicialización de Entorno Web** `[Completada]`
- 🔄 **HU-04: Diseño de Interfaces UI/UX** `[En Progreso: Prototipado Directo en Código / Sin Figma formal]`

### Fase 3: Desarrollo Núcleo App/Web (En Curso — UI Avanzada / Backend Móvil Conectado)

#### Épica 1: Autenticación
- 🔄 **HU-05: Login y Sesión (Web/App)** `[En Progreso — Móvil Completado con Supabase Auth Real / Web No Iniciada]`
  - Móvil: `LoginScreen.tsx` y `AuthContext.tsx` 100% conectados a `supabase.auth.signInWithPassword`, `getSession` y `onAuthStateChange`. Manejo de errores nativo con alertas en español, feedback de carga con `ActivityIndicator` y sesión probada exitosamente con usuario semilla (`tecnico@aleprod.cl`).
  - Web: NO existe `web/app/login/page.tsx`.

#### Épica 2: Plataforma Web
- ❌ **HU-06: Control de Acceso (RBAC)** `[No Iniciado]`
- ❌ **HU-07: Dashboard Central Web** `[No Iniciado — Boilerplate create-next-app intacto]`
- ❌ **HU-08: CRUD de Activos Serializados (Web)** `[No Iniciado]`
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
- 🔄 **HU-13: Aprovisionamiento Masivo (Modo Ráfaga)** `[En Progreso: UI + SQLite Funcionales / Tabla Remota Lista]`
  - Tabla `palmetas_led` con restricciones de unicidad de QR y políticas RLS creadas en Supabase Cloud.
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
| **Core Móvil** | `mobile/src/core/` | `theme/colors.ts`, `api/supabase.ts` (✅ credenciales activas), `db/database.ts` (SQLite síncrona con `incidencias_locales` y `eventos_locales`), `context/AuthContext.tsx` (✅ 100% Supabase Auth). |
| **Módulos Móvil** | `mobile/src/modules/` | 4 módulos con UI premium completa. `EventsScreen.tsx` (tabs y navegación), `EventDetailScreen.tsx` (trazabilidad y cierre de evento), `LoginScreen.tsx` 100% integrado a Supabase Auth. |
| **Web (Admin)** | `web/` | ⚠️ **Boilerplate create-next-app sin modificar.** Pendiente implementar login y dashboard. |
| **Entornos y Secretos** | `mobile/.env`, `web/.env.local.example` | `mobile/.env` con credenciales reales del proyecto `fovmurimpbexfrjwxdew`. |

---

## 4. Próximos Pasos Inmediatos (Post-Auditoría)

1. **Fase 3 - Épica 2 (Plataforma Web Next.js - HU-05 Web, HU-06, HU-07):**
   - Construir autenticación con Supabase Auth SSR en `web/app/login/page.tsx`.
   - Implementar control de acceso RBAC (`admin` vs `tecnico`).
   - Crear Dashboard administrativo con métricas reales de inventario y estado de eventos.
2. **HU-13 (Aprovisionamiento Masivo / Modo Ráfaga en Móvil):**
   - Conectar escaneo ráfaga a la tabla `palmetas_led` en Supabase Cloud con validación de duplicados.
3. **Optimización HU-11 (Auto-sincronización opcional):**
   - Disparar sync en segundo plano inmediatamente tras registrar incidencia si el dispositivo cuenta con red activa.

---

## 5. Bitácora de Cambios Recientes (Session Log)

- **2026-10-21 (Sesión 11 — Motor de Sincronización Real y Supabase Storage HU-12 y HU-14):**
  - Implementación del servicio de sincronización por lote `mobile/src/core/api/sync.ts` (`syncPendingIncidencias`).
  - Carga de imágenes locales a Supabase Storage: función utilitaria `uploadEvidenceImage` con `expo-file-system` (lectura Base64) y `base64-arraybuffer` (decodificación a `ArrayBuffer`) apuntando al bucket `evidencias-incidencias`.
  - Batch INSERT en la tabla `incidencias` de Supabase con resolución resiliente de claves foráneas (`evento_id` por UUID o nombre, `palmeta_id` vía QR UUID).
  - Manejo de confirmación local en SQLite: actualización atómica a `sincronizado = 1`, `sincronizado_at = now()` y persistencia de `remoteFotoUrl`.
  - Tolerancia a fallos: ante errores de conectividad o HTTP en la nube, los registros y fotos locales permanecen intactos en `incidencias_locales` (`sincronizado = 0`) para futuros reintentos sin pérdida de información ni crasheos.
  - Refactorización de `mobile/src/modules/settings-sync/screens/SettingsScreen.tsx`: eliminación completa del `setTimeout` simulado, integración de `ActivityIndicator` reactivo y feedback detallado con alertas nativas (`Alert.alert`).
  - Verificación de tipos TypeScript (`npx tsc --noEmit`) con **0 errores**.

- **2026-10-21 (Sesión 10 — Ciclo de Vida de Eventos HU-16, Scanner Anti-Huérfanas HU-11 y Montaje Dinámico en Home HU-10):**
  - Conexión de `HomeScreen.tsx` con el evento real activo (`estado = 'en_curso'`): consulta híbrida Supabase + SQLite (`getActiveLocalEvento`).
  - Implementación de estado activo con navegación a `EventDetailScreen` y estado vacío "Sin Montaje Activo" con acceso rápido a la agenda de eventos si no hay montajes en curso.
  - Implementación de helper `getActiveLocalEvento` y `upsertLocalEvento` en `mobile/src/core/db/database.ts`.
  - Implementación completa de HU-16 (pestañas "En Curso" e "Historial" en `EventsScreen.tsx`, `EventDetailScreen.tsx` con modo Read-Only).
  - Implementación de flujo Camera-First en `EventDetailScreen.tsx` con `IncidentScannerModal.tsx` y refactorización de `ReportIncidentModal.tsx` vinculando activo y evento real.
  - Verificación de tipos TypeScript (`npx tsc --noEmit`) con **0 errores**.
  - Implementación completa de la HU-16 para gestión del ciclo de vida de eventos en terreno.
  - Creación de pantalla `mobile/src/modules/home-event/screens/EventDetailScreen.tsx` y ruta `mobile/app/event-detail.tsx` con opciones de navegación nativa (header oculto en stack).
  - Integración de pestañas segmentadas "En Curso" e "Historial" en `EventsScreen.tsx` con conteo dinámico en badges, diseño LiquidGlass y navegación `router.push('/event-detail')`.
  - Inclusión de `useFocusEffect` en `EventsScreen.tsx` para sincronización inmediata tras el cierre de eventos en el detalle.
  - Implementación de consulta híbrida de incidencias por `evento_id`: lectura local síncrona en SQLite (`incidencias_locales`) y remota en Supabase Cloud (`incidencias`), combinadas y ordenadas cronológicamente.
  - Creación de tabla `eventos_locales` en SQLite (`database.ts`) y métodos `getLocalIncidenciasByEvento` y `updateLocalEventoEstado`.
  - Lógica de Cierre y Read-Only: botón "Finalizar Evento" con alerta destructiva de confirmación que actualiza `estado = 'finalizado'` y `fecha_termino` en Supabase y SQLite; bloqueo automático de botones de reporte y mutación en eventos finalizados.
  - Validación de tipos en TypeScript (`npx tsc --noEmit`) con **0 errores**.

- **2026-10-21 (Sesión 9 — Despliegue DDL en Supabase Cloud y Conexión HU-05 Móvil):**
  - Conexión vía MCP de Supabase al proyecto activo `Aleprod` (`fovmurimpbexfrjwxdew`, región `sa-east-1`).
  - Creación del archivo `mobile/.env` con credenciales reales `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
  - Inyección del esquema relacional DDL completo en PostgreSQL: tablas `perfiles`, `eventos`, `palmetas_led`, `repuestos_inventario`, `incidencias` y `consumo_repuestos`.
  - Habilitación de Row Level Security (RLS) en el 100% de las tablas con políticas de acceso para perfiles, técnicos y administradores.
  - Implementación del trigger de base de datos `tr_descontar_stock_repuesto` (HU-15) sobre `consumo_repuestos` y trigger `handle_new_user` para perfiles.
  - Creación del bucket de Storage público `evidencias-incidencias` con políticas de carga autenticada.
  - Creación y verificación exitosa del usuario semilla de terreno `tecnico@aleprod.cl` / `Aleprod2026!` con GoTrue token compatibility y evento inicial "Festival Estadio Nacional".
  - Refactorización de `mobile/src/core/context/AuthContext.tsx`: eliminación de `devBypass` activo, desacople 100% reactivo a `supabase.auth.getSession()` y `supabase.auth.onAuthStateChange`.
  - Creación del componente `StartEventBottomSheet.tsx` con LiquidGlassView, selector y búsqueda de recintos frecuentes, stepper numérico y chips de m², selector de configuración LED e inserción directa en `eventos` de Supabase vinculada al técnico autenticado.
  - Refactorización de `EventsScreen.tsx`: integración de botón CTA superior con gradiente dorado, hero card para inicio rápido, pull-to-refresh y sincronización en tiempo real con la tabla `eventos` de Supabase.
  - Actualización de esquema en Supabase Cloud para `eventos`: agregado de columnas `tecnico_id`, `metros_cuadrados` y `tipo_pantalla` junto con políticas RLS de inserción para técnicos y administradores.
  - Verificación de tipos TypeScript (`npx tsc --noEmit`) en `/mobile` con **0 errores**.

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
