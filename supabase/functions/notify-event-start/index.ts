// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code is designed to run in Supabase Edge Functions (Deno runtime).

import { createClient } from 'npm:@supabase/supabase-js@2';

interface WebhookPayload {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  schema?: string;
  record?: {
    id: string;
    nombre: string;
    estado: string;
    locacion?: string;
    [key: string]: any;
  };
  old_record?: {
    id?: string;
    estado?: string;
    [key: string]: any;
  };
  // Soporte para invocación directa sin wrapper de webhook
  id?: string;
  nombre?: string;
  estado?: string;
}

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    evento_id: string;
    nombre_evento: string;
  };
  priority: 'default' | 'normal' | 'high';
  channelId?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método no permitido. Solo se acepta POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: WebhookPayload = await req.json().catch(() => ({}));

    // Resolver el registro del evento desde el payload del webhook o invocación directa
    const record = body.record || (body.id && body.nombre ? (body as any) : null);

    if (!record) {
      console.warn('[notify-event-start] Payload no contiene "record" de evento válido:', body);
      return new Response(
        JSON.stringify({ error: 'Payload inválido: no se encontró registro del evento.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar condición operativa: solo notificar cuando el evento está 'en_curso'
    if (record.estado !== 'en_curso') {
      console.log(
        `[notify-event-start] Evento "${record.nombre}" (${record.id}) tiene estado "${record.estado}". Notificación omitida.`
      );
      return new Response(
        JSON.stringify({
          message: `Evento en estado "${record.estado}". No requiere emisión de push.`,
          skipped: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si viene de un webhook con old_record, asegurar que hubo una transición a 'en_curso'
    if (body.old_record && body.old_record.estado === 'en_curso') {
      console.log(
        `[notify-event-start] Evento "${record.nombre}" ya se encontraba en_curso previamente. Omitiendo notificación duplicada.`
      );
      return new Response(
        JSON.stringify({
          message: 'El evento ya estaba en_curso previamente. No se duplicó el envío.',
          skipped: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Instanciar cliente de Supabase Admin con Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[notify-event-start] Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta (variables de entorno ausentes).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Consultar todos los técnicos con push_token activo en la tabla perfiles
    const { data: perfiles, error: perfilesError } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre_completo, rol, push_token')
      .eq('rol', 'tecnico')
      .not('push_token', 'is', null);

    if (perfilesError) {
      console.error('[notify-event-start] Error consultando perfiles de técnicos:', perfilesError);
      return new Response(
        JSON.stringify({ error: 'Error al consultar técnicos en base de datos.', details: perfilesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!perfiles || perfiles.length === 0) {
      console.log('[notify-event-start] No se encontraron técnicos con push_token registrado.');
      return new Response(
        JSON.stringify({
          message: 'No hay técnicos registrados con tokens push activos.',
          sent_count: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar tokens válidos de Expo (formato ExponentPushToken[...] o ExpoPushToken[...])
    const validTokens = perfiles
      .map((p) => p.push_token?.trim())
      .filter((t): t is string => Boolean(t && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken') || t.length > 20)));

    if (validTokens.length === 0) {
      console.log('[notify-event-start] Ningún token tiene formato válido de Expo Push.');
      return new Response(
        JSON.stringify({
          message: 'Ningún token registrado cumple con el formato válido de Expo.',
          sent_count: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(
      `[notify-event-start] Preparando envío para ${validTokens.length} técnico(s) ante el inicio de "${record.nombre}"...`
    );

    // Construir array de mensajes para la API de Expo Push
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title: '¡Montaje Iniciado!',
      body: `El Coordinador ha iniciado: ${record.nombre}`,
      data: {
        evento_id: record.id,
        nombre_evento: record.nombre,
      },
      priority: 'high',
      channelId: 'eventos_montaje',
    }));

    // Dividir en lotes de hasta 100 mensajes (límite recomendado por la API de Expo)
    const chunkSize = 100;
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push(messages.slice(i, i + chunkSize));
    }

    const allTickets: any[] = [];

    for (const chunk of chunks) {
      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const responseData = await expoResponse.json().catch(() => ({}));
      if (responseData?.data) {
        allTickets.push(...responseData.data);
      } else {
        allTickets.push(responseData);
      }
    }

    console.log(`[notify-event-start] Emisión completada exitosamente. Total enviados: ${messages.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        evento_id: record.id,
        nombre_evento: record.nombre,
        sent_count: messages.length,
        tickets: allTickets,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[notify-event-start] Error inesperado en Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Error interno al procesar notificación push.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

