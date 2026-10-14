# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 14 de Octubre de 2026.
- **Fase del Proyecto:** **Fase 3 (Desarrollo Núcleo App/Web)** en plena marcha.
- **Sprint Activo:** Épica 1: Autenticación, Épica 3: Operación Móvil en Terreno (**100% de UI/Flujos Móviles Terminados**) y Épica 4: Persistencia y Sincronización.
- **Salud del Monorepo:** 100% libre de errores de tipado (`npx tsc --noEmit` exitoso en `/mobile`), navegación nativa en **Expo Router** con **`<NativeTabs>`** (`expo-router/unstable-native-tabs` con **Liquid Glass real de iOS** y SF Symbols en "Inicio" y "Ajustes") + **botón individual circular de escáner QR flotante independiente** a la derecha en Amarillo Suave (`#FACC15`), cristal oscuro `systemThinMaterialDark` al 75% de opacidad y persistencia síncrona en SQLite.

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
- ⏳ **HU-09: Gestión de Inventario a Granel (Web)** `[Siguiente en Web]`

---

## 3. Estado de la Infraestructura y Archivos Clave

| Componente | Ruta | Estado Actual |
| :--- | :--- | :--- |
| **Arnés de Contexto** | `AGENTS.md` y `.ai/*.md` | Centralizado en raíz, 5 módulos activos de memoria viva y reglas estrictas. |
| **Enrutamiento Móvil (Expo Router)** | `mobile/app/` | Cáscara de navegación con `_layout.tsx` (Root Stack con SQLite `initDB`, AuthProvider Supabase y bypass), `(tabs)/_layout.tsx` (`<NativeTabs>` nativo con Liquid Glass iOS `systemThickMaterialDark` y SF Symbols), y puentes limpios a `src/modules/`. |
| **Core Móvil** | `mobile/src/core/` | `theme/colors.ts`, `api/supabase.ts`, `db/database.ts` (API síncrona SQLite), `context/AuthContext.tsx`, `components/LiquidGlassView.tsx`, `utils/haptics.ts` (`triggerHaptic`). |
| **Módulos Móvil** | `mobile/src/modules/` | `auth/screens/LoginScreen.tsx`, `home-event/screens/HomeScreen.tsx` (Liquid Glass Header + 120pb + `useRouter`), `scanner-incidents/screens/ScannerScreen.tsx` (`useRouter` + ráfaga), `scanner-incidents/screens/AssetDetailScreen.tsx` (`useLocalSearchParams` + `router.back`), `scanner-incidents/components/ReportIncidentModal.tsx`, `settings-sync/screens/SettingsScreen.tsx`. |
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

- **2026-10-14 (Sesión 6 — Migración a Expo Router y Bottom Tabs Nativos con `<NativeTabs>`):**
  - Instalación de dependencias del ecosistema Expo Router en `/mobile`: `expo-router`, `expo-linking`, `expo-constants`.
  - Configuración de `"main": "expo-router/entry"` en [package.json](file:///c:/Workspace/aleprod-capstone/mobile/package.json), `"scheme": "aleprod"` y plugin `"expo-router"` en [app.json](file:///c:/Workspace/aleprod-capstone/mobile/app.json).
  - Creación de [AuthContext.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/context/AuthContext.tsx) para desacoplar el estado de autenticación y permitir `devBypass` transparente en desarrollo.
  - Creación de la cáscara de navegación modular en `mobile/app/`:
    - [app/_layout.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/_layout.tsx): Inicialización de `initDB()`, verificación de sesión y Root `<Stack>` (`login`, `(tabs)`, `scanner`, `escanear`, `asset-detail`). Registro de `scanner` y `escanear` con `presentation: 'fullScreenModal'` y animación `slide_from_bottom`.
    - [app/(tabs)/_layout.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/(tabs)/_layout.tsx): Implementación de `<NativeTabs>` de `expo-router/unstable-native-tabs` con Liquid Glass nativo iOS (`systemThinMaterialDark` con opacidad calibrada `rgba(11, 13, 16, 0.75)`), 3 pestañas activas ("Inicio", "Eventos" y "Ajustes") con SF Symbols oficiales (`square.grid.2x2` / `square.grid.2x2.fill`, `calendar` y `slider.horizontal.3`) en Amarillo Suave (`#FACC15`) y botón individual circular de Escáner QR de 54pt. Calibración geométrica simétrica con `TAB_OFFSET = 62` (`navigation.ts`, shift simétrico de 31pt) para centrar el bloque conjunto `[ Tabs ] + ( QR )` exactamente al centro de la pantalla manteniendo el contenido de las pantallas a ancho completo y sin franjas negras.
    - [app/scanner.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/scanner.tsx) y [app/escanear.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/escanear.tsx): Puentes al escáner en Root Stack que ejecutan [ScannerScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/screens/ScannerScreen.tsx) a pantalla completa con visor de cámara, cambio de modos (Inspección vs Ráfaga HU-13), simulación de escaneo y botón de cierre `✕` (`router.back()`). Jerarquía visual optimizada: botón de cierre `✕` ubicado en la esquina superior derecha (`right: 18`, `top: insets.top + 6`) en tono Rojo Suave (`#F87171`) con fondo translúcido y selector de modo centrado y descendido (`marginTop: insets.top + 50`) para máxima ergonomía y alcance al pulgar.
    - [EventsScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/EventsScreen.tsx) y [app/(tabs)/eventos.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/(tabs)/eventos.tsx): Nueva pantalla de agenda técnica con listado de eventos (Estadio Nacional, Movistar Arena, Gala Espacio Riesco, Festival de Viña), filtros de estado ("En Curso", "Próximos", "Programados"), fichas técnicas y barras de avance de superficie en m². Compensación `marginLeft: TAB_OFFSET` y `width: screenWidth` para preservar la alineación perfecta de las tarjetas y headers.
    - Rutas puente conectadas sin duplicar lógica: [app/(tabs)/index.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/(tabs)/index.tsx), [app/(tabs)/eventos.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/(tabs)/eventos.tsx), [app/(tabs)/escanear.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/(tabs)/escanear.tsx), [app/(tabs)/ajustes.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/(tabs)/ajustes.tsx), [app/login.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/login.tsx) y [app/asset-detail.tsx](file:///c:/Workspace/aleprod-capstone/mobile/app/asset-detail.tsx).
  - Actualización de navegación a `useRouter()` y `useLocalSearchParams()` en [HomeScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/home-event/screens/HomeScreen.tsx), [ScannerScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/screens/ScannerScreen.tsx) y [AssetDetailScreen.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/modules/scanner-incidents/screens/AssetDetailScreen.tsx).
  - Limpieza de barras custom previas en [MainTabNavigator.tsx](file:///c:/Workspace/aleprod-capstone/mobile/src/core/navigation/MainTabNavigator.tsx) y eliminación de archivos legados `App.tsx` e `index.ts`.
  - Verificación estricta de compilación con `npx tsc --noEmit` en `/mobile` (0 errores).
