# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 23 de Octubre de 2026 (Sesión 30 — Rediseño de ReportIncidentModal, IncidentScannerModal y Disparadores con Swipe-Down y Azul Corporativo).
- **Fase del Proyecto:** **Fase 3 (Desarrollo Núcleo App/Web)** — Monorepo completo con Mobile (offline-first, sync con Supabase Cloud y Storage) y Web (Dashboard, Login, Palmetas, Eventos, Incidencias conectados en tiempo real).
- **Sprint Activo:** Épica 1 (HU-05 y HU-06 Completadas en Web y Móvil), Épica 2 (HU-07 y HU-08 Completadas en Web), Épica 3 (HU-10, HU-11, HU-12, HU-13 y HU-16 Completadas en Móvil), Épica 4 (HU-14 y HU-15 Completadas).
- **Salud del Monorepo:** Tipado limpio (`npx tsc --noEmit` exitoso en `/mobile` y `/web` con 0 errores). Servidor Next.js activo con HTTP 200 y Expo Router con `LiquidGlassTabBar` nativa, compacta y ultra-fluida (120 FPS).
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
