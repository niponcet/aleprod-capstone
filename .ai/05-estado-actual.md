# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 15 de Octubre de 2026 (Post-Auditoría QA).
- **Fase del Proyecto:** **Fase 3 (Desarrollo Núcleo App/Web)** — UI Móvil avanzada, Backend/Integración Supabase pendiente, Web no iniciada.
- **Sprint Activo:** Épica 1 (Auth parcial), Épica 3 (UI Móvil lista, lógica parcial con SQLite local, **sin integración Supabase real**), Épica 4 (Sincronización simulada).
- **Salud del Monorepo:** Tipado limpio (`npx tsc --noEmit` exitoso en `/mobile`). Navegación con **Expo Router** y `<NativeTabs>` (Liquid Glass iOS). Persistencia síncrona en SQLite funcional.
- **⚠️ Hallazgo Crítico de Auditoría:** No existen archivos `.env` con credenciales Supabase reales. El cliente Supabase usa `placeholder.supabase.co`. La variable `isSupabaseConfigured` retorna `false` siempre. **Ninguna operación de red real ha sido ejecutada contra Supabase.**

---

## 2. Historias de Usuario (HUs) — Estado de Avance AUDITADO

### Fase 2: Arquitectura y Configuración Cloud (Completada — Infraestructura Base)
- ✅ **HU-01: Infraestructura Base** `[Completada]`
- ✅ **HU-02: Inicialización App Móvil y Escaneo Offline** `[Completada]`
- ✅ **HU-03: Inicialización de Entorno Web** `[Completada]`
- 🔄 **HU-04: Diseño de Interfaces UI/UX** `[En Progreso: Prototipado Directo en Código / Sin Figma formal]`

### Fase 3: Desarrollo Núcleo App/Web (En Curso — UI Avanzada / Backend Pendiente)

#### Épica 1: Autenticación
- 🔄 **HU-05: Login y Sesión (Web/App)** `[En Progreso — UI Móvil Lista / Supabase Auth NO configurado / Web No Iniciada]`
  - Móvil: `LoginScreen.tsx` con UI premium y llamada `signInWithPassword` codificada, pero `.env` no configurado → siempre cae a modo demo (`devBypass`).
  - Web: NO existe `web/app/login/page.tsx`.

#### Épica 2: Plataforma Web
- ❌ **HU-06: Control de Acceso (RBAC)** `[No Iniciado]`
- ❌ **HU-07: Dashboard Central Web** `[No Iniciado — Boilerplate create-next-app intacto]`
- ❌ **HU-08: CRUD de Activos Serializados (Web)** `[No Iniciado]`
- ❌ **HU-09: Gestión de Inventario a Granel (Web)** `[No Iniciado]`

#### Épica 3: Operación Móvil en Terreno
- 🔄 **HU-10: Módulo de Sesión Activa por Evento** `[En Progreso: UI Lista + Datos Hardcodeados]`
  - `HomeScreen.tsx`: UI premium con Liquid Glass. Actividad reciente se alimenta de SQLite real (`getRecentActivity`), pero las métricas de m² (70/15/5/140) y el nombre del evento ("Festival Estadio Nacional") están **hardcodeados en el JSX**. Incluye 2 cards de actividad de referencia/mockup estáticas.
- 🔄 **HU-11: Formulario de Incidencias In Situ** `[En Progreso: UI Lista + SQLite Local / Falta INSERT a Supabase]`
  - `ReportIncidentModal.tsx`: Bottom Sheet con selector 2x2, haptics y persistencia real en SQLite (`insertLocalIncidencia`). El `evento_id` está hardcodeado como `'Festival Estadio Nacional'`. **No hay INSERT a tabla `incidencias` de Supabase.**
- 🔄 **HU-12: Captura de Evidencia Fotográfica** `[En Progreso: Captura Local Funcional / Falta Upload a Supabase Storage]`
  - `expo-image-picker` funcional (cámara + galería fallback). URI local guardada en SQLite. **No hay upload a Supabase Storage bucket.**
- 🔄 **HU-13: Aprovisionamiento Masivo (Modo Ráfaga)** `[En Progreso: UI + SQLite Funcionales / Falta Enrolamiento en Supabase]`
  - Toggle Inspección/Ráfaga funcional con contador en vivo y guardado en SQLite. **Falta INSERT real en tabla `palmetas_led` de Supabase** y validación de UUID contra inventario remoto.

#### Épica 4: Persistencia y Sincronización
- 🔄 **HU-14: Motor de Sincronización a Supabase** `[En Progreso: UI + Conteo Local / Sincronización SIMULADA]`
  - `SettingsScreen.tsx`: Contador reactivo de pendientes (`getPendingSyncCount`) y botón "Sincronizar Ahora" con UI. **La sincronización usa `setTimeout(1200ms)` + `markAllAsSynced()` que solo cambia flag local. NO hay batch INSERT real a Supabase ni upload de fotos.**
- ❌ **HU-15: Trigger de Descuento de Stock** `[No Iniciado]`

---

## 3. Estado de la Infraestructura y Archivos Clave

| Componente | Ruta | Estado Actual |
| :--- | :--- | :--- |
| **Arnés de Contexto** | `AGENTS.md` y `.ai/*.md` | Centralizado en raíz, 5 módulos activos. |
| **Enrutamiento Móvil (Expo Router)** | `mobile/app/` | `<NativeTabs>` con Liquid Glass iOS, SF Symbols, botón QR flotante. |
| **Core Móvil** | `mobile/src/core/` | `theme/colors.ts`, `api/supabase.ts` (⚠️ placeholder), `db/database.ts` (SQLite síncrona funcional), `context/AuthContext.tsx` (⚠️ devBypass siempre activo). |
| **Módulos Móvil** | `mobile/src/modules/` | 4 módulos con UI premium completa. Lógica de negocio limitada a SQLite local. |
| **Web (Admin)** | `web/` | ⚠️ **Boilerplate create-next-app sin modificar.** `page.tsx` muestra "To get started, edit the page.tsx file". No hay rutas de login ni dashboard. |
| **Entornos y Secretos** | `mobile/.env.example`, `web/.env.local.example` | ⚠️ Solo plantillas con placeholders. **No existen `.env` reales con credenciales Supabase.** |

---

## 4. Próximos Pasos Inmediatos (Post-Auditoría)

1. **Configurar Supabase Real:**
   - Crear proyecto en Supabase Dashboard.
   - Configurar `.env` en `/mobile` y `/web` con URL y Anon Key reales.
   - Crear tablas remotas (`eventos`, `palmetas_led`, `incidencias`, `repuestos`) y policies RLS.

2. **HU-05 Completa (Auth Real):**
   - Probar `signInWithPassword` contra Supabase Auth real.
   - Crear `web/app/login/page.tsx` con estética corporativa dorada.

3. **HU-10 → HU-13 (Integración Backend):**
   - Reemplazar datos hardcodeados en `HomeScreen` y `EventsScreen` por queries a Supabase.
   - Conectar `insertLocalIncidencia` a un flujo de sync real.
   - Implementar upload de fotos a Supabase Storage.

4. **HU-14 (Sincronización Real):**
   - Reemplazar `setTimeout` simulado por batch `supabase.from('incidencias').insert()` real.
   - Implementar upload de `foto_uri` a bucket de Storage y actualizar URL remota.

5. **Épica 2 (Web):**
   - Construir login, dashboard y CRUD de palmetas en Next.js.

---

## 5. Bitácora de Cambios Recientes (Session Log)

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
