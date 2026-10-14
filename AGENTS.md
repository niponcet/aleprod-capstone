# AI Context Router & Protocol — Alejandra Producciones (aleprod-capstone)

> **AVISO PARA AGENTES DE IA (Claude, Antigravity, Cursor, Copilot y afines):**  
> Este repositorio utiliza una arquitectura de contexto centralizada (**AI Context Harness**). Todo agente DEBE seguir estrictamente las directrices aquí definidas antes de proponer o modificar código.

---

## 1. Identificación del Proyecto y Estructura Monorepo

Este repositorio corresponde al proyecto de modernización técnica y logística de **Alejandra Producciones**, estructurado como un **Monorepo**:

- **`/mobile`**: Aplicación móvil para técnicos en terreno (Expo SDK 51+, React Native, TypeScript, SQLite Offline-First).
- **`/web`**: Panel de control administrativo y jefatura (Next.js App Router, TypeScript, Tailwind CSS, Supabase SSR).
- **Backend / Cloud**: Supabase (PostgreSQL con RLS, Auth, Storage).

---

## 2. Regla Mandatoria de Inicio de Sesión para Agentes

Antes de generar diagnósticos, proponer planes o modificar código en este repositorio, el agente **DEBE**:

1. **Consultar la Memoria Viva en [.ai/05-estado-actual.md](file:///c:/Workspace/aleprod-capstone/.ai/05-estado-actual.md) y [ROADMAP.md](file:///c:/Workspace/aleprod-capstone/ROADMAP.md):**  
   Verificar el estado fáctico más reciente, las HUs completadas en el último commit y los próximos pasos inmediatos antes de comenzar cualquier tarea.
2. **Revisar y acatar las directrices en [.ai/](file:///c:/Workspace/aleprod-capstone/.ai/):**  
   Bajo ninguna circunstancia romper las reglas técnicas, convenciones de base de datos o lógica de negocio descritas en los módulos de contexto.

---

## 3. Índice del AI Context Harness (`.ai/`)

Toda la verdad arquitectónica, funcional, visual y de estado reside centralizada en los siguientes documentos:

| Archivo | Propósito y Contenido Clave |
| :--- | :--- |
| **[.ai/01-negocio-y-reglas.md](file:///c:/Workspace/aleprod-capstone/.ai/01-negocio-y-reglas.md)** | **Dominio de Negocio y Reglas Operativas:** Contexto del cliente (palmetas LED y pistas de baile), **Regla de los 3 Taps** en móvil, arquitectura **Offline-First**, gestión de inventario (activos serializados vs a granel) y control de acceso basado en roles (**RBAC**). |
| **[.ai/02-arquitectura-stack.md](file:///c:/Workspace/aleprod-capstone/.ai/02-arquitectura-stack.md)** | **Stack Tecnológico y Reglas Estrictas de Código:** Regla estricta de Expo SQLite (solo API síncrona moderna), uso de `<CameraView>` de expo-camera, convenciones de Supabase SSR / Client en Next.js, y prefijos de variables de entorno (`EXPO_PUBLIC_` y `NEXT_PUBLIC_`). |
| **[.ai/03-ui-ux-branding.md](file:///c:/Workspace/aleprod-capstone/.ai/03-ui-ux-branding.md)** | **Identidad Visual y Sistema de Diseño:** Paleta de colores oficial (Negro Profundo, Dorado corporativo, Blanco puro y semáforo semántico), estética premium de alto contraste y **Dark Mode por defecto** en la app para técnicos en terreno. |
| **[.ai/04-base-de-datos.md](file:///c:/Workspace/aleprod-capstone/.ai/04-base-de-datos.md)** | **Modelo de Datos y Sincronización:** Documentación de la tabla local SQLite `incidencias_locales` (definida en `mobile/src/db/database.ts`), esquema relacional en PostgreSQL Supabase, triggers de inventario y protocolo de sincronización Offline -> Cloud. |
| **[.ai/05-estado-actual.md](file:///c:/Workspace/aleprod-capstone/.ai/05-estado-actual.md)** | **Memoria Viva y Estado Actual:** Estado real del sprint al último commit, registro de HUs terminadas, bitácora de cambios recientes y próximos pasos inmediatos. **Lectura obligatoria al iniciar cualquier tarea.** |

---

## 4. Protocolo de Memoria (Actualización Continua)

> **REGLA ESTRICTA PARA LA IA:**  
> Cada vez que completes una Historia de Usuario (HU), modifiques el esquema de base de datos o el usuario te pida "cerrar sesión / actualizar estado", **DEBES actualizar automáticamente [.ai/05-estado-actual.md](file:///c:/Workspace/aleprod-capstone/.ai/05-estado-actual.md), [.ai/04-base-de-datos.md](file:///c:/Workspace/aleprod-capstone/.ai/04-base-de-datos.md) (si aplica) y el estado en [ROADMAP.md](file:///c:/Workspace/aleprod-capstone/ROADMAP.md)**.
>
> Ninguna tarea técnica se considerará completada si la memoria viva del repositorio no refleja fidedignamente los cambios realizados y los siguientes pasos a abordar.

---

## 5. Comandos Rápidos de Referencia

- **Móvil:** `cd mobile && npm run start` / `npx expo start`
- **Web:** `cd web && npm run dev`
- **Chequeo de Tipos:** `npx tsc --noEmit` en sus respectivos subdirectorios.
