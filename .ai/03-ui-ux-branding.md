# 03 — Identidad Visual, Branding y Directrices de UI/UX

> **Alejandra Producciones (aleprod-capstone)**  
> Este documento define el sistema de diseño, la paleta cromática, la tipografía y las pautas ergonómicas de interfaz para la App Móvil de terreno y el Panel Administrativo Web.

---

## 1. Identidad Visual y Concepto de Marca

- **Marca:** **Alejandra Producciones**.
- **Personalidad:** Sofisticada, moderna, técnica, sobria y de alto rendimiento.
- **Atmósfera:** Inspirada en la estética nocturna de eventos de gala y tecnología de iluminación LED de vanguardia.
- **Contraste y Nitidez:** Prioridad absoluta a la legibilidad y al alto contraste visual en pantallas OLED/AMOLED bajo condiciones de luz extrema (pistas de baile oscuras vs. galpones iluminados).

---

## 2. Paleta Cromática Oficial

```
  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
  │ Negro Profundo  │   │ Blanco Puro     │   │ Dorado Primario │   │ Dorado Acento   │
  │ #000000 / #0A0A0A│   │ #FFFFFF         │   │ #D4AF37         │   │ #C5A059         │
  └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
```

### A. Fondos Base y Superficies Neutras
- **Negro Profundo (`#000000`, `#0A0A0A`):** Fondo base primordial de la app móvil y el dashboard administrativo oscuro. Optimiza el consumo de batería en pantallas de smartphones.
- **Superficie de Tarjetas / Modales (`#121212`, `#1E1E1E`):** Fondos de elevación para cards, modales, hojas inferiores (bottom sheets) y contenedores de datos.
- **Bordes Neutros y Separadores (`#27272A`, `#3F3F46`):** Líneas finas para delimitar componentes sin saturar la vista.
- **Blanco Puro (`#FFFFFF`):** Tipografía principal sobre fondo oscuro, íconos de alto contraste y fondos de secciones limpias e informes impresos en la plataforma web.

### B. Acentos y Detalles Primarios (Dorado Corporativo)
- **Dorado Principal (`#D4AF37`):** Color de marca para botones principales (Call-to-Action), bordes de selección activa, focos de entrada y títulos destacados.
- **Dorado Secundario / Hover (`#C5A059`):** Estados de interacción (hover, pressed), badges especiales y detalles secundarios.
- **Dorado Translúcido (`rgba(212, 175, 55, 0.15)`): Resplandores (glow effects), fondos de chips seleccionados y halos del escáner QR.

### C. Paleta Semántica (Estados de Palmetas e Incidencias)
Utilizada estrictamente para representar la salud del equipamiento y el estado de los reportes:

| Estado del Activo | Color Semántico | Código HEX | Significado Operativo |
| :--- | :--- | :--- | :--- |
| **Operativo / Óptimo** | Verde Esmeralda | `#10B981` / `#059669` | Palmeta lista para montaje, probada y sin fallas. Registro sincronizado en la nube. |
| **En Mantención / Reparación** | Ámbar Cálido | `#F59E0B` / `#D97706` | Palmeta con daño menor, en revisión técnica de taller o pendiente de sincronizar. |
| **Falla Crítica / Baja** | Rojo Coral | `#EF4444` / `#DC2626` | Palmeta inoperativa, riesgo de cortocircuito, módulo roto o dada de baja. |

---

## 3. UX en Terreno: Aplicación Móvil (`/mobile`)

Los técnicos operan bajo condiciones críticas: cabinas de control oscuras, escenarios con luces estroboscópicas, guantes de trabajo y prisa logística.

### Directrices de Diseño Móvil:
1. **Dark Mode por Defecto y Obligatorio:**  
   La app móvil opera en modo oscuro de forma predeterminada para evitar encandilar a los técnicos en eventos con baja iluminación y maximizar la autonomía de la batería durante turnos de más de 8 horas.
2. **Botones de Toque Ergonómicos (Fat Finger Friendly):**  
   - Los elementos accionables deben tener un área táctil mínima de **48x48 dp (recomendado 56dp o superior)**.
   - Espaciado generoso entre opciones para evitar pulsaciones erróneas durante el flujo de los 3 taps.
3. **Escáner Centrado en la Tarea:**  
   - El visor de la cámara (`<CameraView>`) debe ocupar el espacio principal con una retícula dorada estilizada (`#D4AF37`).
   - Retroalimentación auditiva y háptica sutil cuando se detecte un QR exitosamente.
4. **Legibilidad Inmediata:**  
   - Tipografía con pesos definidos (Medium / Bold) en tamaños nunca inferiores a 16px para texto secundario y 20-24px para códigos UUID y encabezados.

---

## 4. UX Administrativa: Plataforma Web (`/web`)

El personal de jefatura y logística utiliza la plataforma web para tomar decisiones rápidas sobre la disponibilidad de equipos para eventos futuros.

### Directrices de Diseño Web:
1. **Diseño Dashboard Ejecutivo:**  
   - Header superior sobrio con branding de Alejandra Producciones en dorado y blanco.
   - KPIs numéricos visibles en tarjetas de alto impacto (Total Palmetas, Disponibilidad %, En Reparación, Stock Crítico).
2. **Visualización de Inventario y Estados:**  
   - Tablas interactivas con filtros inmediatos por estado operativo (Verde, Ámbar, Rojo).
   - Acceso rápido al detalle y bitácora histórica de cada palmeta escaneada.
3. **Claridad en Repuestos e Insumos:**  
   - Barra visual de nivel de stock para repuestos a granel, resaltando en rojo coral aquellos que se encuentren por debajo del stock mínimo de seguridad.
