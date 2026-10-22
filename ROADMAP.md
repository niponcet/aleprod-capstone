# ROADMAP Y PRODUCT BACKLOG (Alejandra Producciones)

**Documento Maestro de Planificación Ágil**
- **Proyecto:** Sistema de Gestión Operativa e Inventario
- **Metodología:** Scrum (Sprints Quincenales)

---

## Fase 1: Requisitos y Diseño (Fecha límite: 27-08-2026)
- **Estado:** Completada
- **Entregables:** Acta de Constitución, SRS y Modelo E-R.

---

## Fase 2: Arquitectura y Configuración Cloud (Fecha límite: 10-09-2026)
- **Estado:** Completada (Infraestructura base lista)
- **Entregables:** Repositorio Monorepo, Boilerplate Móvil y Web, Esquema SQLite Local.

### Backlog Fase 2:
- **HU-01: Infraestructura Base** `[Completada]`
  - **Descripción:** Inicializar proyecto en Supabase, crear modelo relacional en PostgreSQL y documentar API Keys.
- **HU-02: Inicialización App Móvil y Escaneo Offline** `[Completada]`
  - **Descripción:** Crear boilerplate en Expo (React Native), habilitar cámara para escanear UUID y configurar base de datos local SQLite.
- **HU-03: Inicialización de Entorno Web** `[Completada]`
  - **Descripción:** Crear boilerplate web con Next.js (App Router), TailwindCSS y configurar cliente de Supabase (SSR).
- **HU-04: Diseño de Interfaces UI/UX** `[En Progreso: Prototipado Directo en Código / Sin Figma formal]`
  - **Descripción:** Diseñar wireframes/mockups en Figma para la App Móvil (Regla de 3 Taps) y el Dashboard Web.

---

## Fase 3: Desarrollo Núcleo App/Web (Fecha límite: 29-10-2026)
- **Estado:** En Progreso — UI Móvil Avanzada / Backend e Integración Supabase Pendientes / Web No Iniciada
- **Entregables:** MVP funcional desplegado.

### Épica 1: Autenticación y Seguridad
- **HU-05: Login y Sesión (Web/App)** `[En Progreso — Móvil 100% Conectado a Supabase Auth Real con Sesión Activa / Web Pendiente]`
  - **Descripción:** Implementar inicio de sesión con correo/contraseña consumiendo Supabase Auth. App móvil completamente conectada con `getSession()` y `onAuthStateChange`, manejo de errores nativo y usuario semilla verificado.
- **HU-06: Control de Acceso (RBAC)** `[No Iniciado]`
  - **Descripción:** Configurar navegación condicional (Técnico vs Admin) y proteger rutas mediante Row Level Security (RLS).

### Épica 2: Plataforma Administrativa Next.js (Web)
- **HU-07: Dashboard Central** `[No Iniciado — Web es boilerplate create-next-app intacto]`
  - **Descripción:** Crear vista general con métricas de palmetas operativas vs en reparación.
- **HU-08: CRUD de Activos Serializados (Palmetas)** `[No Iniciado]`
  - **Descripción:** Desarrollar interfaz web para listar, filtrar y editar los estados de las palmetas LED.
- **HU-09: Gestión de Inventario a Granel (Repuestos)** `[No Iniciado]`
  - **Descripción:** Interfaz para visualizar el stock actual de insumos, herramientas y repuestos.

### Épica 3: Operación Móvil en Terreno (App)
- **HU-10: Módulo de Sesión Activa por Evento y Métricas Dinámicas** `[Completada]`
  - **Descripción:** Visualización de evento de turno, métricas en m² y agenda de eventos. `HomeScreen.tsx` 100% conectado a datos dinámicos: cálculo de área según estándar Aleprod (1 palmeta = 0.25 m² para pantallas P3.9) consultando en tiempo real la tabla `palmetas_led` en Supabase por estado ('operativo', 'mantencion', 'baja'); actividad reciente híbrida (Supabase + SQLite) de las últimas 3 incidencias con badges y semáforo semántico; y botón "Historial >" enlazado a la nueva pantalla dedicada `ActivityHistoryScreen.tsx` con filtros por evento y FlatList optimizada.

- **HU-11: Formulario de Incidencias In Situ** `[En Progreso: UI Lista + Persistencia SQLite Local / Falta INSERT a Supabase]`
  - **Descripción:** Modal Bottom Sheet tipo 3 taps (`ReportIncidentModal.tsx`). Los reportes se guardan correctamente en SQLite local, pero NO se envían a la tabla `incidencias` de Supabase.
- **HU-12: Captura de Evidencia Fotográfica** `[Completada]`
  - **Descripción:** Captura con `expo-image-picker` y subida a Supabase Storage (`evidencias-incidencias`) mediante `uploadEvidenceImage()` en `sync.ts` (Base64 -> ArrayBuffer). Obtención de URL pública y vinculación automática a la incidencia.
- **HU-13: Aprovisionamiento Masivo (Modo Ráfaga)** `[Completada]`
  - **Descripción:** Módulo de aprovisionamiento continuo en `ScannerScreen.tsx` conectado a Supabase y SQLite. Inserción directa en la tabla `palmetas_led` (`codigo_qr`, `estado = 'operativo'`, `lote_ingreso = 'LOTE-MMYYYY'`). Manejo robusto de duplicados (PostgreSQL 23505 y restricciones de unicidad) con aviso visual no bloqueante (Toast animado) sin pausar el flujo de ráfaga. Resiliencia Offline completa con almacenamiento temporal en SQLite (`palmetas_pendientes`) y sincronización por lote en `sync.ts` (`syncPendingPalmetas`) accesible desde Configuración.

- **HU-16: Ciclo de Vida e Historial de Eventos** `[Completada]`
  - **Descripción:** Gestión de estados (`en_curso` y `finalizado`) en Supabase y SQLite. Segmentación en `EventsScreen.tsx` con pestañas interactivas "En Curso" e "Historial". Nueva pantalla `EventDetailScreen.tsx` con métricas del montaje ($m^2$, recintos, equipamiento) y trazabilidad de incidencias (consulta híbrida SQLite/Supabase). Mecanismo de cierre ("Finalizar Evento") y modo estricto de Solo Lectura (Read-Only) para eventos archivados.

### Épica 4: Persistencia y Sincronización
- **HU-14: Motor de Sincronización a Supabase** `[Completada]`
  - **Descripción:** Motor de sincronización batch real implementado en `sync.ts` y conectado a `SettingsScreen.tsx`. Procesa incidencias pendientes en SQLite (`sincronizado = 0`), sube fotos a Storage, resuelve foreign keys relacionales seguras (`evento_id` y `palmeta_id`), ejecuta `INSERT` en PostgreSQL `incidencias` y actualiza la bandera local `sincronizado = 1` solo ante confirmación exitosa con manejo resiliente de red.
- **HU-15: Trigger de Descuento de Stock** `[Completada]`
  - **Descripción:** Trigger PostgreSQL `tr_descontar_stock_repuesto` implementado y activo en Supabase. Al registrar consumo en `consumo_repuestos`, descuenta atómicamente el stock en `repuestos_inventario` y previene stock negativo.

---

## Fase 4: UAT / Marcha Blanca (Fecha límite: 12-11-2026)
- **Estado:** Futuro
- **Entregables:** Pruebas de campo con técnicos reales.

### Backlog Fase 4:
- **HU-17: QA Testing (Pruebas de Estrés)**
  - **Descripción:** Ejecución de casos de prueba (ej: validación de sincronización simulando modo avión).
- **HU-18: Marcha Blanca en Terreno**
  - **Descripción:** Despliegue de la app en teléfonos del equipo de Alejandra Producciones durante un evento real.

---

## Fase 5: Cierre y Entrega Final (Fecha límite: 26-11-2026)
- **Estado:** Futuro
- **Entregables:** Documentación y Defensa.

### Backlog Fase 5:
- **HU-19: Documentación Final**
  - **Descripción:** Redacción del Informe Final de Pruebas, Manual de Usuario y Manual Técnico de Despliegue.
