-- ==============================================================================
-- Migración: Tabla Maestra de Centros de Eventos y Políticas RLS
-- Proyecto: Alejandra Producciones (aleprod-capstone)
-- Fecha: 2026-11-05
-- ==============================================================================

-- 1. Crear tabla centros_eventos si no existe
CREATE TABLE IF NOT EXISTS public.centros_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Comentario descriptivo
COMMENT ON TABLE public.centros_eventos IS 'Tabla maestra de centros de eventos y recintos recurrentes para montajes de Alejandra Producciones.';

-- 2. Asegurar columna centro_id en la tabla eventos con llave foránea
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'eventos' 
      AND column_name = 'centro_id'
  ) THEN
    ALTER TABLE public.eventos ADD COLUMN centro_id uuid REFERENCES public.centros_eventos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Habilitar RLS en centros_eventos
ALTER TABLE public.centros_eventos ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para usuarios autenticados y anónimos (lectura en app y dashboard)
DROP POLICY IF EXISTS "Lectura de centros de eventos" ON public.centros_eventos;
CREATE POLICY "Lectura de centros de eventos"
ON public.centros_eventos
FOR SELECT
TO authenticated, anon
USING (true);

-- Política de inserción / administración para usuarios autenticados (Gerencia y Coordinación)
DROP POLICY IF EXISTS "Insercion y gestion de centros de eventos" ON public.centros_eventos;
CREATE POLICY "Insercion y gestion de centros de eventos"
ON public.centros_eventos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Poblado de recintos recurrentes estándar de producción técnica
INSERT INTO public.centros_eventos (nombre)
VALUES
  ('Espacio Riesco'),
  ('Movistar Arena'),
  ('Estadio Nacional'),
  ('Metropolitan Santiago (Ex CasaPiedra)'),
  ('CentroParque'),
  ('Club Hípico de Santiago'),
  ('Quinta Vergara'),
  ('Parque Bicentenario de Cerrillos'),
  ('Monticello Grand Casino')
ON CONFLICT (nombre) DO NOTHING;

