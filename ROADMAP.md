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
- **HU-05: Login y Sesión (Web/App)** `[En Progreso — UI Móvil Lista / Supabase Auth NO configurado (.env con placeholders) / Web No Iniciada]`
  - **Descripción:** Implementar inicio de sesión con correo/contraseña consumiendo Supabase Auth.
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
- **HU-10: Módulo de Sesión Activa por Evento** `[En Progreso: UI Lista + Datos Hardcodeados / Falta integración Supabase]`
  - **Descripción:** Visualización de evento de turno, métricas en m², desglose de equipos y actividad reciente. La UI está completa con datos estáticos y actividad parcial de SQLite local, pero las métricas (m², palmetas) y el nombre del evento están fijos en código sin consultar tablas remotas.
- **HU-11: Formulario de Incidencias In Situ** `[En Progreso: UI Lista + Persistencia SQLite Local / Falta INSERT a Supabase]`
  - **Descripción:** Modal Bottom Sheet tipo 3 taps (`ReportIncidentModal.tsx`). Los reportes se guardan correctamente en SQLite local, pero NO se envían a la tabla `incidencias` de Supabase.
- **HU-12: Captura de Evidencia Fotográfica** `[En Progreso: Captura Local Funcional / Falta Upload a Supabase Storage]`
  - **Descripción:** Captura con `expo-image-picker` funcional con previsualización. La URI se guarda en SQLite, pero la foto **no se sube a Supabase Storage** (bucket).
- **HU-13: Aprovisionamiento Masivo (Modo Ráfaga)** `[En Progreso: UI + SQLite Local Funcionales / Falta Enrolamiento en Supabase]`
  - **Descripción:** Toggle de modo en `ScannerScreen.tsx` funcional con contador en vivo y guardado en SQLite. Falta el INSERT real en tabla `palmetas_led` de Supabase y validación de UUID contra inventario remoto.

### Épica 4: Persistencia y Sincronización
- **HU-14: Motor de Sincronización a Supabase** `[En Progreso: UI + Conteo Local Listos / Sincronización SIMULADA con setTimeout]`
  - **Descripción:** El botón "Sincronizar Ahora" y el contador de pendientes funcionan sobre SQLite, pero la sincronización usa `setTimeout` simulado que solo cambia flags locales. NO hay batch INSERT real a Supabase ni upload de fotos a Storage.
- **HU-15: Trigger de Descuento de Stock** `[No Iniciado]`
  - **Descripción:** Script SQL en Supabase que reste automáticamente unidades de repuestos al registrar una resolución.

---

## Fase 4: UAT / Marcha Blanca (Fecha límite: 12-11-2026)
- **Estado:** Futuro
- **Entregables:** Pruebas de campo con técnicos reales.

### Backlog Fase 4:
- **HU-16: QA Testing (Pruebas de Estrés)**
  - **Descripción:** Ejecución de casos de prueba (ej: validación de sincronización simulando modo avión).
- **HU-17: Marcha Blanca en Terreno**
  - **Descripción:** Despliegue de la app en teléfonos del equipo de Alejandra Producciones durante un evento real.

---

## Fase 5: Cierre y Entrega Final (Fecha límite: 26-11-2026)
- **Estado:** Futuro
- **Entregables:** Documentación y Defensa.

### Backlog Fase 5:
- **HU-18: Documentación Final**
  - **Descripción:** Redacción del Informe Final de Pruebas, Manual de Usuario y Manual Técnico de Despliegue.
