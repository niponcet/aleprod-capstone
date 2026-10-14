# 01 — Dominio del Negocio, Reglas Operativas y RBAC

> **Alejandra Producciones (aleprod-capstone)**  
> Este documento establece los fundamentos de negocio, directrices operativas en terreno y el modelo de control de acceso que deben regir todas las decisiones de diseño e implementación del software.

---

## 1. Contexto del Negocio y Cliente

- **Cliente:** **Alejandra Producciones**.
- **Giro:** Empresa de producción técnica para eventos de alto estándar (matrimonios, eventos corporativos, festivales, activaciones de marca).
- **Activos Principales:** Pistas de baile interactivas y pantallas modulares compuestas por **palmetas LED**.
- **Desafío Operativo:** Las palmetas sufren desgaste mecánico, golpes, quemaduras de circuitos o fallas de conectores durante el transporte, montaje y desmontaje. Históricamente, la falta de trazabilidad digital provocaba que equipos defectuosos se reutilizaran en eventos siguientes sin mantención previa.
- **Entorno de Trabajo:** Galpón/bodega central (recepción, aprovisionamiento, reparación) y locaciones de eventos (hoteles, parcelas, centros de convenciones con iluminación tenue, ruido, estrés temporal y mala conectividad).

---

## 2. Regla de Oro en Terreno: "Regla de los 3 Taps" (Móvil)

La aplicación móvil es una herramienta de trabajo rudo en terreno para el personal técnico, no una aplicación administrativa de oficina.

* **Premisa:** En pleno montaje o desmontaje, un técnico no puede perder tiempo completando formularios extensos ni navegando múltiples pantallas.
* **Directriz Estricta:** Registrar una incidencia técnica sobre una palmeta LED tras escanear su código QR **NO DEBE tomar más de 3 toques (3 taps) en pantalla**.
* **Flujo Operativo de 3 Taps:**
  1. **Tap 1 (Escaneo/Activación):** El técnico apunta la cámara y el sistema detecta y valida instantáneamente el código QR (UUID) de la palmeta.
  2. **Tap 2 (Selección Rápida de Falla):** Selector visual en botones grandes con las fallas más comunes (ej.: *Palmeta Apagada*, *Módulo LED Quemado*, *Conector Suelto/Roto*, *Fisura/Golpe Físico*).
  3. **Tap 3 (Confirmación / Guardar):** Toque de confirmación inmediata que guarda el registro en la base de datos local y opcionalmente permite captura fotográfica rápida de evidencia.
* **Tiempo Meta:** Registro completado en menos de **5 segundos**.

---

## 3. Arquitectura Offline-First (Móvil)

En las locaciones de eventos (subterráneos, galpones aislados, carpas o parcelas campestres) **NO EXISTE garantía de conectividad a internet**.

* **Principio Rector:** La aplicación móvil debe comportarse de forma nativa como si estuviese en modo avión de forma continua. **Nunca** una llamada de red o latencia de Supabase debe bloquear, congelar o impedir el trabajo del técnico.
* **Ciclo de Persistencia Local Primero:**
  1. **Escritura Inmediata:** Toda incidencia, escaneo o actualización de estado se guarda **primero y de inmediato en la base de datos local SQLite** (`aleprod_local.db`).
  2. **Lectura Inmediata:** La interfaz móvil consulta y lista la información desde SQLite local.
  3. **Preservación del Timestamp:** El registro almacena la fecha/hora local exacta en que ocurrió el suceso (`new Date().toISOString()`), garantizando trazabilidad real.
* **Sincronización en Segundo Plano (Background Sync):**
  - Un servicio en segundo plano monitorea el estado de la red (WiFi / Datos móviles).
  - Al detectar conexión estable a internet, despacha los registros pendientes hacia Supabase en lotes ordenados.
  - El backend en Supabase **respeta y persiste el timestamp original generado en terreno**, no la hora de sincronización.
  - Tras confirmación exitosa de Supabase, se marca el registro local como sincronizado.

---

## 4. Lógica de Inventario: Activos Serializados vs. Inventario a Granel

El modelo de datos y la experiencia de usuario separan de forma tajante dos tipos de activos:

### A. Activos Serializados Individuales (Palmetas LED)
* **Identificación:** Cada palmeta cuenta con una identidad única mediante **Código QR (UUID)** y código alfanumérico visible.
* **Gestión Unitaria:** Se rastrea su ciclo de vida individual (Fabricante, fecha de alta, historial de eventos donde estuvo, historial de incidencias y mantenciones).
* **Estados de Ciclo de Vida:**
  - `Operativo` (Verde esmeralda)
  - `En Mantención` (Ámbar)
  - `En Reparación` (Ámbar intenso)
  - `Falla Crítica / Baja` (Rojo coral)

### B. Inventario a Granel (Repuestos e Insumos)
* **Naturaleza:** Piezas no serializadas individualmente: módulos LED de repuesto, fuentes de poder, conectores PowerCON/EtherCON, tornillos, fusibles y herramientas.
* **Gestión por Stock:** Se administran por conteo cuantitativo (cantidades numéricas, unidades mínimas y stock de seguridad).
* **Descuento Automatizado:** Al registrar el cierre o reparación de una incidencia en el taller, **triggers en la base de datos PostgreSQL** descuentan automáticamente del stock la cantidad de repuestos utilizados, alertando si se cae por debajo del umbral mínimo.

---

## 5. Control de Acceso y Roles (RBAC)

El sistema opera bajo dos roles claramente diferenciados:

```
                                  ┌──────────────────────────────┐
                                  │   Alejandra Producciones     │
                                  └──────────────┬───────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────────┐
                     ▼                                                       ▼
       ┌───────────────────────────┐                           ┌───────────────────────────┐
       │       ROL: TÉCNICO        │                           │  ROL: ADMIN / JEFATURA    │
       ├───────────────────────────┤                           ├───────────────────────────┤
       │ • Uso exclusivo App Móvil │                           │ • Panel Web Next.js Total │
       │ • Selección de Evento     │                           │ • Dashboard & Métricas    │
       │ • Escaneo QR (3 Taps)     │                           │ • CRUD Activos & Repuestos│
       │ • Evidencia Fotográfica   │                           │ • App: Modo Ráfaga (Alta) │
       │ • Persistencia Offline    │                           │ • Gestión de Usuarios/RLS │
       └───────────────────────────┘                           └───────────────────────────┘
```

### 1. Rol: Técnico (Operario de Terreno)
- **Plataforma:** Exclusivamente la **App Móvil (`/mobile`)**.
- **Capacidades:**
  - Iniciar sesión y asociar su jornada al evento activo.
  - Escanear códigos QR de palmetas LED.
  - Levantar reportes de falla con la regla de los 3 taps.
  - Capturar y adjuntar evidencia fotográfica usando la cámara del dispositivo.
  - Visualizar el resumen de palmetas escaneadas en el evento en curso (leído desde SQLite).
- **Restricciones:** No tiene acceso al panel administrativo web ni puede modificar configuraciones globales del inventario.

### 2. Rol: Administrador / Jefatura (Logística y Operaciones)
- **Plataforma:** **Panel Web (`/web`)** + Acceso con privilegios especiales en la **App Móvil**.
- **Capacidades Web:**
  - Dashboard central con métricas en tiempo real (palmetas operativas, porcentaje de fallas, eventos activos).
  - CRUD completo de palmetas LED y visualización del historial técnico.
  - Control y ajuste de stock de inventario a granel (repuestos).
  - Consulta y exportación de reportes de mantención.
- **Capacidades Móviles (Modo Especial):**
  - Acceso al **"Modo Ráfaga" (Aprovisionamiento Masivo):** Flujo móvil optimizado para enrolar decenas de códigos QR de palmetas nuevas consecutivamente en bodega, vinculando sus UUID a la base central de Supabase sin pausas intermedias.
