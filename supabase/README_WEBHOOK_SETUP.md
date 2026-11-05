# Guía de Despliegue y Configuración de Webhooks — Alejandra Producciones

Este documento detalla los pasos para desplegar la **Edge Function** y configurar el **Database Webhook** que notifica a los técnicos vía Expo Push cuando un evento pasa a estado `en_curso`.

---

## 1. Despliegue de la Edge Function (`notify-event-start`)

La función se encuentra en [`supabase/functions/notify-event-start/index.ts`](./functions/notify-event-start/index.ts).

### Pasos con Supabase CLI:

1. **Iniciar sesión en Supabase CLI** (si no lo has hecho):
   ```bash
   npx supabase login
   ```

2. **Vincular el proyecto de Alejandra Producciones**:
   ```bash
   npx supabase link --project-ref fovmurimpbexfrjwxdew
   ```

3. **Desplegar la función**:
   ```bash
   npx supabase functions deploy notify-event-start --no-verify-jwt
   ```
   *(Nota: La bandera `--no-verify-jwt` permite que los Database Webhooks internos de Supabase o llamadas del backend puedan invocarla sin requerir token JWT de usuario final).*

---

## 2. Aplicar la Migración de Base de Datos

Ejecuta el archivo de migración [`supabase/migrations/20261105162000_webhook_notify_event.sql`](./migrations/20261105162000_webhook_notify_event.sql) en el **SQL Editor** del Dashboard de Supabase.

Esto creará:
1. La columna `push_token` en `public.perfiles`.
2. El índice optimizado `idx_perfiles_tecnicos_push_token`.
3. La función y trigger con `pg_net` para disparo automático ante cambios de estado a `en_curso`.

---

## 3. Alternativa Nativa: Configurar el Webhook desde el Dashboard de Supabase (Recomendada)

Si prefieres usar la interfaz visual de **Database Webhooks** de Supabase en lugar del trigger `pg_net`:

1. Ve a tu proyecto en **Supabase Studio** (`https://supabase.com/dashboard/project/fovmurimpbexfrjwxdew`).
2. En el menú lateral izquierdo, haz clic en **Database** -> **Webhooks**.
3. Haz clic en **Create a new webhook** (o **Enable Webhooks** si es la primera vez).
4. Completa el formulario con los siguientes valores:
   - **Name:** `notify-event-start-webhook`
   - **Table:** `eventos` (Schema: `public`)
   - **Events:** Marca únicamente **Update** (desmarca Insert y Delete).
5. En la sección **Webhook configuration**:
   - **Type:** Selecciona **Supabase Edge Functions**.
   - **Edge Function:** Elige `notify-event-start`.
   - **Method:** `POST`
   - **Timeout:** `5000` ms (por defecto).
6. Haz clic en **Create Webhook**.

---

## 4. Prueba Rápida de la Función (Smoke Test)

Puedes probar la Edge Function ejecutando una llamada `curl` de prueba:

```bash
curl -i --location --request POST 'https://fovmurimpbexfrjwxdew.supabase.co/functions/v1/notify-event-start' \
--header 'Content-Type: application/json' \
--data '{
  "record": {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Festival Prueba Push",
    "estado": "en_curso"
  }
}'
```

### Respuesta esperada:
```json
{
  "success": true,
  "evento_id": "00000000-0000-0000-0000-000000000001",
  "nombre_evento": "Festival Prueba Push",
  "sent_count": 1,
  "tickets": [...]
}
```
*(Si no hay técnicos con token registrado, responderá con `sent_count: 0` informando que no hay destinatarios sin fallar).*

