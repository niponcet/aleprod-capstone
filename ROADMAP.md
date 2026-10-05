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
- **Estado:** En Cierre
- **Entregables:** Repositorio Monorepo, Base de Datos Cloud y Prototipos.

### Backlog Fase 2:
- **HU-01: Infraestructura Base** `[Completada]`
  - **Descripción:** Inicializar proyecto en Supabase, crear modelo relacional en PostgreSQL y documentar API Keys.
- **HU-02: Inicialización App Móvil y Escaneo Offline** `[Completada]`
  - **Descripción:** Crear boilerplate en Expo (React Native), habilitar cámara para escanear UUID y configurar base de datos local SQLite.
- **HU-03: Inicialización de Entorno Web** `[Completada]`
  - **Descripción:** Crear boilerplate web con Next.js (App Router), TailwindCSS y configurar cliente de Supabase (SSR).
- **HU-04: Diseño de Interfaces UI/UX** `[Pendiente]`
  - **Descripción:** Diseñar wireframes/mockups en Figma para la App Móvil (Regla de 3 Taps) y el Dashboard Web.

---

## Fase 3: Desarrollo Núcleo App/Web (Fecha límite: 29-10-2026)
- **Estado:** Siguiente (Sprints de Código)
- **Entregables:** MVP funcional desplegado.

### Épica 1: Autenticación y Seguridad
- **HU-05: Login y Sesión (Web/App)**
  - **Descripción:** Implementar inicio de sesión con correo/contraseña consumiendo Supabase Auth.
- **HU-06: Control de Acceso (RBAC)**
  - **Descripción:** Configurar navegación condicional (Técnico vs Admin) y proteger rutas mediante Row Level Security (RLS).

### Épica 2: Plataforma Administrativa Next.js (Web)
- **HU-07: Dashboard Central**
  - **Descripción:** Crear vista general con métricas de palmetas operativas vs en reparación.
- **HU-08: CRUD de Activos Serializados (Palmetas)**
  - **Descripción:** Desarrollar interfaz web para listar, filtrar y editar los estados de las palmetas LED.
- **HU-09: Gestión de Inventario a Granel (Repuestos)**
  - **Descripción:** Interfaz para visualizar el stock actual de insumos, herramientas y repuestos.

### Épica 3: Operación Móvil en Terreno (App)
- **HU-10: Módulo de Sesión Activa por Evento**
  - **Descripción:** Dropdown en la app para seleccionar el evento de turno.
- **HU-11: Formulario de Incidencias In Situ**
  - **Descripción:** Pantalla rápida (Regla de 3 taps) para registrar el tipo de falla y detalles técnicos vinculados al UUID escaneado.
- **HU-12: Captura de Evidencia Fotográfica**
  - **Descripción:** Permitir tomar una foto de la falla desde la app para adjuntarla al reporte.
- **HU-13: Aprovisionamiento Masivo (Modo Ráfaga)**
  - **Descripción:** Flujo para administrador en la app que permite enrolar múltiples QR rápidamente.

### Épica 4: Persistencia y Sincronización
- **HU-14: Motor de Sincronización a Supabase**
  - **Descripción:** Lógica que detecta internet y envía los registros guardados en el SQLite local hacia Supabase.
- **HU-15: Trigger de Descuento de Stock**
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
