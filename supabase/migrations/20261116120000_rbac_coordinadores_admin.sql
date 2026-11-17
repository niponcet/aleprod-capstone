-- ==============================================================================
-- Migración: RBAC para Coordinadores y Administradores
-- Proyecto: Alejandra Producciones (aleprod-capstone)
-- Fecha: 2026-11-16
-- ==============================================================================

-- 1. Políticas en public.perfiles para que administradores puedan gestionar perfiles
DROP POLICY IF EXISTS "Admins pueden actualizar cualquier perfil" ON public.perfiles;
CREATE POLICY "Admins pueden actualizar cualquier perfil" 
ON public.perfiles FOR UPDATE TO authenticated 
USING (
  (auth.uid() = id) OR 
  (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'))
);

DROP POLICY IF EXISTS "Admins pueden insertar perfiles" ON public.perfiles;
CREATE POLICY "Admins pueden insertar perfiles" 
ON public.perfiles FOR INSERT TO authenticated 
WITH CHECK (
  (auth.uid() = id) OR 
  (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'))
);

DROP POLICY IF EXISTS "Admins pueden eliminar perfiles" ON public.perfiles;
CREATE POLICY "Admins pueden eliminar perfiles" 
ON public.perfiles FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- 2. Políticas en public.palmetas_led para coordinadores y admins
DROP POLICY IF EXISTS "Gestion de palmetas para administradores" ON public.palmetas_led;
CREATE POLICY "Gestion de palmetas para administradores y coordinadores" 
ON public.palmetas_led FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador'))
);

-- 3. Políticas en public.incidencias para resolución por coordinadores
DROP POLICY IF EXISTS "Admins pueden actualizar o eliminar incidencias" ON public.incidencias;
CREATE POLICY "Admins y coordinadores pueden actualizar o eliminar incidencias" 
ON public.incidencias FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador'))
);

-- 4. Políticas en public.eventos para coordinadores y admins
DROP POLICY IF EXISTS "Gestion de eventos para administradores" ON public.eventos;
CREATE POLICY "Gestion de eventos para administradores y coordinadores" 
ON public.eventos FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador'))
);

DROP POLICY IF EXISTS "Creadores y admins pueden actualizar eventos" ON public.eventos;
CREATE POLICY "Creadores, admins y coordinadores pueden actualizar eventos" 
ON public.eventos FOR UPDATE TO authenticated 
USING (
  (tecnico_id IS NULL) OR 
  (auth.uid() = tecnico_id) OR 
  (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'coordinador', 'tecnico')))
);

