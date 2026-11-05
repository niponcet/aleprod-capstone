# Brand Assets — Alejandra Producciones (aleprod-capstone)

Esta carpeta es el **repositorio maestro de identidad visual y recursos de marca** del monorepo.

## 1. Kit Oficial de Marca (`assets/brand/alejandra_producciones_assets/`)
Contiene los archivos maestros en alta definición y formatos vectoriales:
- `logo.svg`, `logo-horizontal.svg`, `logo-completo.png`, `logo-horizontal.png`
- `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`
- `apple-touch-icon.png` (180x180)
- `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon-master.png`
- `manifest-icons-snippet.json`

## 2. Estructura de Distribución en el Monorepo:

### A. Móvil (`/mobile`)
- **`mobile/assets/`** (Empaquetado Nativo Expo / EAS Build):
  - `icon.png`: Ícono maestro de la app (512x512).
  - `android-icon-foreground.png`: Ícono adaptativo Android (maskable 512x512).
  - `splash-icon.png`: Logo para splash screen.
  - `favicon.png`: Favicon Expo Web (32x32).
  - `logo-horizontal.png` y `logo-completo.png`: Logos para vistas y cabeceras.
- **`mobile/public/`** (PWA iOS WebKit & Android Chrome):
  - `apple-touch-icon.png`: Ícono de pantalla de inicio en iOS (180x180).
  - `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `favicon.png`.
  - `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-192.png`, `icons/icon-maskable-512.png`.
  - `manifest.json`: Configurado con soporte completo standalone, tema `#000000` y variantes any/maskable.

### B. Web (`/web`)
- **`web/public/`** (Panel Administrativo Next.js):
  - `favicon.ico`, `favicon-16.png`, `favicon-32.png`.
  - `apple-touch-icon.png` (180x180).
  - `icons/` (192, 512, maskable 192/512).
  - `logo.svg`, `logo-horizontal.svg`, `logo-horizontal.png`, `logo-completo.png`.
  - Registrado en `web/app/layout.tsx` a través del objeto `metadata.icons`.

