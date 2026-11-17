-- Migración: PIN de 4 dígitos para Eventos y Tabla de Participantes (Técnicos Unidos)
-- Fecha: 16 de Noviembre de 2026

-- 1. Agregar columna pin_acceso a eventos si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eventos' AND column_name = 'pin_acceso'
  ) THEN
    ALTER TABLE public.eventos 
    ADD COLUMN pin_acceso VARCHAR(4) DEFAULT lpad(floor(random() * 9000 + 1000)::text, 4, '0');
  END IF;
END $$;

UPDATE public.eventos 
SET pin_acceso = lpad(floor(random() * 9000 + 1000)::text, 4, '0')
WHERE pin_acceso IS NULL OR length(pin_acceso) != 4;

-- 2. Crear tabla de participantes de eventos
CREATE TABLE IF NOT EXISTS public.evento_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  tecnico_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  fecha_union TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT uq_evento_participante UNIQUE (evento_id, tecnico_id)
);

ALTER TABLE public.evento_participantes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'evento_participantes' AND policyname = 'Lectura de participantes para usuarios autenticados'
  ) THEN
    CREATE POLICY "Lectura de participantes para usuarios autenticados" 
      ON public.evento_participantes FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'evento_participantes' AND policyname = 'Tecnicos pueden registrar su propia union'
  ) THEN
    CREATE POLICY "Tecnicos pueden registrar su propia union" 
      ON public.evento_participantes FOR INSERT TO authenticated 
      WITH CHECK (auth.uid() = tecnico_id OR EXISTS (
        SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'evento_participantes' AND policyname = 'Admins y coordinadores pueden actualizar participantes'
  ) THEN
    CREATE POLICY "Admins y coordinadores pueden actualizar participantes" 
      ON public.evento_participantes FOR UPDATE TO authenticated 
      USING (EXISTS (
        SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador')
      ));
  END IF;
END $$;

