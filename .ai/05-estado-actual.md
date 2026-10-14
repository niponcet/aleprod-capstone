# 05 — Estado Actual del Proyecto y Memoria Viva

> **Alejandra Producciones (aleprod-capstone)**  
> **Documento de Memoria Viva:** Este archivo refleja el estado fáctico, los hitos completados y las decisiones tomadas en el último commit/sesión. Debe ser consultado y actualizado de forma continua para preservar el contexto entre sesiones y agentes.

---

## 1. Ficha de Estado General

- **Fecha de Última Actualización:** 13 de Octubre de 2026.
- **Fase del Proyecto:** **Fase 2 (En Cierre)** ➔ Transición a **Fase 3 (Desarrollo Núcleo App/Web)**.
- **Sprint Activo:** Cierre de Configuración Base y Diseño / Preparación de Épica de Autenticación.
- **Salud del Monorepo:** Estable (sin conflictos de tipado, dependencias inicializadas y arnés de contexto centralizado).

---

## 2. Historias de Usuario (HUs) — Estado de Avance

### Fase 2: Arquitectura y Configuración Cloud (En Cierre)
- ✅ **HU-01: Infraestructura Base** `[Completada]`
  - Proyecto inicializado en Supabase Cloud (PostgreSQL, Auth, Storage).
  - Variables de entorno parametrizadas con prefijos de seguridad (`EXPO_PUBLIC_` y `NEXT_PUBLIC_`).
  - Configuración de `.env.example` en `/mobile` y `.env.local.example` en `/web`.
- ✅ **HU-02: Inicialización App Móvil y Escaneo Offline** `[Completada]`
  - Boilerplate funcional en React Native con Expo (SDK 51+ / SDK ~57).
  - Escáner de código QR operativo mediante `<CameraView>` y `useCameraPermissions` en `mobile/src/screens/ScannerScreen.tsx`.
  - Persistencia local inmediata en SQLite mediante API síncrona moderna (`openDatabaseSync`, `execSync`, `runSync`) con la tabla `incidencias_locales` en `mobile/src/db/database.ts`.
- ✅ **HU-03: Inicialización de Entorno Web** `[Completada]`
  - Panel administrativo inicializado en Next.js (App Router, v16+) con TypeScript y Tailwind CSS v4.
  - Paquetes `@supabase/supabase-js` y `@supabase/ssr` instalados y listos para configurar clientes Server/Client.
- ⏳ **HU-04: Diseño de Interfaces UI/UX** `[Pendiente / En Preparación]`
  - Definición de sistema de diseño y paleta completada en `.ai/03-ui-ux-branding.md` (Negro Profundo, Dorado corporativo, semáforo semántico, Dark Mode para terreno).
  - Pendiente: Wireframes/mockups y componentes visuales base para el flujo de los 3 Taps y Dashboard.

---

## 3. Estado de la Infraestructura y Archivos Clave

| Componente | Ruta | Estado Actual |
| :--- | :--- | :--- |
| **Arnés de Contexto** | `AGENTS.md` y `.ai/*.md` | Centralizado en raíz, archivos duplicados de subcarpetas eliminados. |
| **Móvil (App)** | `mobile/` | Expo SDK 51+ configurado, SQLite local activo, escáner QR listo. |
| **Web (Admin)** | `web/` | Next.js App Router configurado con Tailwind CSS y dependencias SSR de Supabase. |
| **Entornos y Secretos** | `mobile/.env.example`, `web/.env.local.example` | Plantillas de variables públicas listas y documentadas. |
| **Repositorio / Git** | `.gitignore` en raíz y paquetes | Archivos `.env*`, `node_modules`, `.expo` y `.next` excluidos correctamente. |

---

## 4. Próximos Pasos Inmediatos

1. **HU-04: Prototipos UI/UX (Móvil y Web):**
   - Diseñar/implementar los wireframes y componentes base de la app móvil respetando estrictamente la **Regla de los 3 Taps** y el **Dark Mode** de terreno.
   - Definir layout base del Dashboard administrativo web con estética sobria y acentos dorados.
2. **HU-05: Implementación de Login y Sesión (Fase 3):**
   - Implementar autenticación con correo/contraseña consumiendo Supabase Auth en `/web` y `/mobile`.
   - Establecer el enrutamiento protegido inicial y almacenar token de sesión según el rol asignado (`tecnico` o `admin`).

---

## 5. Bitácora de Cambios Recientes (Session Log)

- **2026-10-13:**
  - Implementación del arnés de contexto centralizado (**AI Context Harness**): creación de `AGENTS.md` en la raíz y módulos `.ai/01-negocio-y-reglas.md`, `.ai/02-arquitectura-stack.md`, `.ai/03-ui-ux-branding.md`, `.ai/04-base-de-datos.md`.
  - Limpieza de archivos redundantes (`mobile/AGENTS.md`, `web/AGENTS.md`, `web/CLAUDE.md`).
  - Documentación de la tabla SQLite local `incidencias_locales` y especificación del modelo relacional cloud para Supabase con triggers de inventario.
  - Creación del archivo de memoria viva `.ai/05-estado-actual.md` para trazabilidad inter-sesión.
