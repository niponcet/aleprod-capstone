/**
 * Sistema de Color Oficial — Alejandra Producciones
 * Basado en las directrices de .ai/03-ui-ux-branding.md
 */

export const colors = {
  // Fondos y Superficies
  background: '#0B0D10',
  backgroundDark: '#0A0A0A',
  surface: '#14171C',
  surfaceElevated: '#1A1D24',
  
  // Bordes y Delimitadores
  border: '#262A34',
  borderLight: '#323745',
  
  // Acentos Dorados y Ámbar
  primary: '#D4AF37',
  primaryAmber: '#E59819',
  primaryLight: '#F3B33D',
  primaryDark: '#C87A08',
  
  // Gradiente oficial para botones principales
  gradientPrimary: ['#C87A08', '#F5C242'] as const,
  
  // Tipografía
  textPrimary: '#FFFFFF',
  textSecondary: '#8E95A2',
  textMuted: '#6B7280',
  textInverse: '#0B0D10',
  
  // Estados Semánticos
  success: '#10B981',       // Operativo / Sincronizado
  warning: '#F59E0B',       // En Mantención / Pendiente
  danger: '#EF4444',        // Falla Crítica / Baja
} as const;

export type ColorTheme = typeof colors;
