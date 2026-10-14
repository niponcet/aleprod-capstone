# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 14 de Octubre de 2026.
- **Fase del Proyecto:** **Fase 3 (Desarrollo Núcleo App/Web)** en plena marcha.
- **Sprint Activo:** Épica 1: Autenticación, Épica 3: Operación Móvil en Terreno (**100% de UI/Flujos Móviles Terminados**) y Épica 4: Persistencia y Sincronización.
- **Salud del Monorepo:** 100% libre de errores de tipado (`npx tsc --noEmit` exitoso en `/mobile`), arquitectura de monolito modular con React Navigation (`MainTabNavigator` + `AppNavigator`), persistencia síncrona en SQLite y cámara `<CameraView>` con soporte de captura fotográfica real (`expo-image-picker`).

---

## 2. Historias de Usuario (HUs) — Estado de Avance

### Fase 2: Arquitectura y Configuración Cloud (Cerrada)
- ✅ **HU-01: Infraestructura Base** `[Completada]`
- ✅ **HU-02: Inicialización App Móvil y Escaneo Offline** `[Completada]`
- ✅ **HU-03: Inicialización de Entorno Web** `[Completada]`
- ⏳ **HU-04: Diseño de Interfaces UI/UX** `[En Curso / Prototipado Directo en Código]`

### Fase 3: Desarrollo Núcleo App/Web (En Curso)
- 🔄 **HU-05: Login y Sesión (Web/App)** `[En Progreso — App Móvil Completada]`
  - Móvil: `LoginScreen.tsx` terminado con validación visual y de credenciales.
  - Web: Pendiente en Next.js App Router con `@supabase/ssr`.
- ✅ **HU-10: Módulo de Sesión Activa por Evento** `[Completada — App Móvil]`
  - `HomeScreen.tsx`: Card de montaje activo ("Festival Estadio Nacional"), métricas en m² (140 m² total, 70 m² operativos, 15 m² mantención, 5 m² baja) y visor de actividad reciente vinculado a SQLite.
- ✅ **HU-11: Formulario de Incidencias In Situ (Regla de 3 Taps)** `[Completada — App Móvil]`
  - `ReportIncidentModal.tsx`: Modal Bottom Sheet con selector 2x2 de componentes defectuosos (Cable de datos, Conector de poder, Placa LED, Fuente), observaciones y persistencia inmediata en SQLite local.
- ✅ **HU-12: Captura de Evidencia Fotográfica** `[Completada — App Móvil]`
  - Integración de `expo-image-picker` para toma de fotos in situ con la cámara (y fallback de galería), previsualización de miniatura en el reporte y almacenamiento de URI local en la tabla SQLite.
- ✅ **HU-13: Aprovisionamiento Masivo (Modo Ráfaga)** `[Completada — App Móvil]`
  - Toggle en `ScannerScreen.tsx` para alternar entre "Modo Inspección" y "Modo Ráfaga (Enrolamiento)", permitiendo escanear decenas de códigos QR de palmetas consecutivamente con contador en vivo y guardado en SQLite sin salir de la cámara.
- 🔄 **HU-14: Motor de Sincronización a Supabase** `[En Progreso — UI y Control Local SQLite Listos]`
  - `SettingsScreen.tsx`: Contador reactivo de pendientes en SQLite y botón "Sincronizar Ahora" con simulación de subida y marcado de registros en diferido.
- ⏳ **HU-06: Control de Acceso (RBAC)** `[Siguiente]`
- ⏳ **HU-07: Dashboard Central Web** `[Siguiente en Web]`
- ⏳ **HU-08: CRUD de Activos Serializados (Web)** `[Siguiente en Web]`
- ⏳ **HU-09: Gestión de Inventario a Granel (Web)** `[Siguiente en Web]`

---

## 3. Estado de la Infraestructura y Archivos Clave

| Componente | Ruta | Estado Actual |
| :--- | :--- | :--- |
| **Arnés de Contexto** | `AGENTS.md` y `.ai/*.md` | Centralizado en raíz, 5 módulos activos de memoria viva y reglas estrictas. |
| **Core Móvil** | `mobile/src/core/` | `theme/colors.ts`, `api/supabase.ts`, `db/database.ts` (API síncrona), `components/LiquidGlassView.tsx` (GlassView + BlurView fallback), `utils/haptics.ts` (`triggerHaptic`), `navigation/AppNavigator.tsx`, `navigation/MainTabNavigator.tsx` (Floating Liquid Glass Tab Bar con `SymbolView`). |
| **Módulos Móvil** | `mobile/src/modules/` | `auth/screens/LoginScreen.tsx`, `home-event/screens/HomeScreen.tsx` (Liquid Glass Header + 120pb), `scanner-incidents/screens/ScannerScreen.tsx` (Liquid Glass controls + haptics), `scanner-incidents/screens/AssetDetailScreen.tsx` (Specs 2x2 grid responsive), `scanner-incidents/components/ReportIncidentModal.tsx` (Liquid Glass sheet + haptics), `settings-sync/screens/SettingsScreen.tsx`. |
| **Web (Admin)** | `web/` | Next.js App Router con Tailwind CSS y dependencias `@supabase/ssr`. |
| **Entornos y Secretos** | `mobile/.env.example`, `web/.env.local.example` | Plantillas de variables públicas listas y documentadas. |

---

## 4. Próximos Pasos Inmediatos

1. **HU-05 (Web) y HU-07 (Dashboard Central):**
   - Construir en `web/app/login/page.tsx` la pantalla de login administrativo con la estética corporativa dorada.
   - Implementar el Dashboard administrativo en `web/app/dashboard/page.tsx` para visualizar las palmetas y métricas reportadas por la app móvil.
2. **HU-14 (Sincronización Cloud Real):**
   - Conectar el botón "Sincronizar Ahora" de la app móvil a una Edge Function o batch insert real en las tablas `incidencias` y `palmetas_led` de Supabase.

---

## 5. Bitácora de Cambios Recientes (Session Log)

- **2026-10-14 (Sesión 5 — Liquid Glass iOS Nativo, Retroalimentación Háptica, SF Symbols y Responsividad iPhone):**
  - Instalación de librerías nativas en `/mobile`: `expo-blur`, `expo-haptics`, `expo-symbols` y `expo-glass-effect`.
  - Creación de [LiquidGlassView.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/components/LiquidGlassView.tsx): Soporte dinámico para `UIGlassEffect` nativo (`GlassView`) con fallback automático de alto estándar en `BlurView` (`systemChromeMaterialDark`, intensidad 80, velo translúcido `rgba(20, 23, 28, 0.55)` y bisel especular `rgba(255, 255, 255, 0.14)`).
  - Creación del helper [haptics.ts](file:///c:/Workspace/aleprod-capstone/mobile/src/core/utils/haptics.ts): Función segura `triggerHaptic` para eventos de selección, impacto ligero/medio y notificaciones de éxito o advertencia.
  - Rediseño de [MainTabNavigator.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/navigation/MainTabNavigator.tsx): Floating Tab Bar compacto tipo cápsula centrada (`height: 66`, `borderRadius: 33`, `left: 36`, `right: 36`, `bottom: 26`), botón central de escáner azul (`#2563EB`, 52x52, halo cristalino, `marginTop: -22`, `SymbolView` `qrcode.viewfinder` nativo con fallback a `Ionicons`), etiqueta alineada y hápticos al pulsar tabs.
  - Integración de Liquid Glass y hápticos en [ScannerScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/screens/ScannerScreen.tsx): Selector de modo, contador ráfaga y tarjeta de simulación con refracción en tiempo real sobre la cámara, y feedback `success` al escanear.
  - Integración de Liquid Glass y hápticos en [ReportIncidentModal.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/components/ReportIncidentModal.tsx): Contenedor de cristal líquido para el Bottom Sheet, hápticos de selección en los 4 botones de componentes defectuosos y `success` al persistir en SQLite.
  - Corrección de responsividad en [AssetDetailScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/screens/AssetDetailScreen.tsx): Columnas `flex: 1, minWidth: 0` en el grid 2x2, íconos con margen de 6pt, valores con ajuste multilínea sin desborde, separación `space-between` en el historial y borde `#262A34` en el banner informativo.
  - Optimización en [HomeScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/HomeScreen.tsx): Header superior fijo ("Hola, Técnico / Sincronizado") posicionado dinámicamente con `useSafeAreaInsets()` (`top: insets.top + 10`, `zIndex: 20`) otorgando margen holgado y natural bajo el notch/Dynamic Island, con `paddingTop: insets.top + 90` y `paddingBottom: 120` en el `ScrollView` para que el contenido pase por detrás con refracción Liquid Glass sin chocar jamás con el borde superior.
  - Verificación estricta de compilación con `npx tsc --noEmit` en `/mobile` (0 errores).
