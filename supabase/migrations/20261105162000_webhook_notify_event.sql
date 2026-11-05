-- ==============================================================================
-- Migración: Webhook y Push Notifications para Inicio de Montajes
-- Proyecto: Alejandra Producciones (aleprod-capstone)
-- Fecha: 2026-11-05
-- ==============================================================================

-- 1. Asegurar columna push_token en la tabla perfiles
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS push_token text;

COMMENT ON COLUMN public.perfiles.push_token IS 'Expo Push Token activo del técnico para notificaciones push en móvil y PWA.';

-- Índice condicional para consultas de alto rendimiento por rol y token activo
CREATE INDEX IF NOT EXISTS idx_perfiles_tecnicos_push_token 
ON public.perfiles(rol, push_token) 
WHERE push_token IS NOT NULL;

-- 2. Habilitar extensión pg_net (cliente HTTP asíncrono para PostgreSQL en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 3. Función Trigger para emitir el webhook hacia la Edge Function de Supabase
CREATE OR REPLACE FUNCTION public.tr_notify_event_start()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
  payload jsonb;
  request_id bigint;
BEGIN
  -- Validar que la transición sea estrictamente hacia 'en_curso'
  IF (OLD.estado IS DISTINCT FROM NEW.estado) AND (NEW.estado = 'en_curso') THEN
    
    -- Construir payload estandarizado de Database Webhook de Supabase
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );

    -- Obtener URL de la función (con fallback al proyecto activo de Supabase)
    edge_function_url := current_setting('app.settings.edge_function_url', true);
    IF edge_function_url IS NULL OR edge_function_url = '' THEN
      -- Subdominio oficial del proyecto: fovmurimpbexfrjwxdew
      edge_function_url := 'https://fovmurimpbexfrjwxdew.supabase.co/functions/v1/notify-event-start';
    END IF;

    -- Obtener Service Role Key si está configurada en la sesión
    service_role_key := current_setting('app.settings.service_role_key', true);

    -- Despachar petición HTTP asíncrona no bloqueante
    SELECT extensions.net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CASE 
          WHEN service_role_key IS NOT NULL AND service_role_key <> '' THEN 'Bearer ' || service_role_key 
          ELSE 'Bearer anon'
        END
      ),
      body := payload
    ) INTO request_id;

    RAISE LOG '[tr_notify_event_start] Webhook despachado a % con request_id: % para evento: %', 
      edge_function_url, request_id, NEW.nombre;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Evitar que una falla en la red o en el webhook aborte la transacción de actualización del evento
    RAISE WARNING '[tr_notify_event_start] Error al despachar webhook de evento: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Creación del Trigger en la tabla eventos
DROP TRIGGER IF EXISTS tr_eventos_notify_start ON public.eventos;

CREATE TRIGGER tr_eventos_notify_start
  AFTER UPDATE OF estado ON public.eventos
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 'en_curso')
  EXECUTE FUNCTION public.tr_notify_event_start();

COMMENT ON TRIGGER tr_eventos_notify_start ON public.eventos IS 
  'Dispara la Edge Function notify-event-start vía pg_net cuando un evento pasa a estado en_curso.';

