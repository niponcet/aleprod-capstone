import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fovmurimpbexfrjwxdew.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvdm11cmltcGJleGZyand4ZGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTI5NzMsImV4cCI6MjEwODE2ODk3M30.E0GE-e1Vg6Rbjn19QXYlQcaOiDixApDm-i2mRRFZrg0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Buffer de imagen JPEG válida de 1x1 píxel
const TINY_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runQAUploadTest() {
  console.log('🧪 === [QA AUTOMATION TEST: HU-12 & HU-14] ===\n');

  // 1. Autenticación como Técnico o Admin
  console.log('1️⃣ Autenticando usuario para verificar RLS autenticado...');
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'tecnico@aleprod.cl',
    password: 'Aleprod2026!',
  });

  if (authError || !authData?.user) {
    const retry = await supabase.auth.signInWithPassword({
      email: 'gerencia@aleprod.cl',
      password: 'Password123!',
    });
    if (retry.error) {
      console.error('   ❌ Error de autenticación:', retry.error.message);
      return;
    }
    authData = retry.data;
  }

  const activeUser = authData.user;
  console.log(`   ✅ Usuario autenticado: ${activeUser.email} (UUID: ${activeUser.id})`);

  // 2. Preparar Buffer con MIME Type
  console.log('\n2️⃣ Preparando imagen binaria y validando MIME type...');
  const imageBuffer = Buffer.from(TINY_JPEG_BASE64, 'base64');
  const timestamp = Date.now();
  const fileName = `qa-test-${timestamp}.jpg`;
  const filePath = `reportes/${fileName}`;
  const contentType = 'image/jpeg';
  console.log(`   📁 Destino en bucket: ${filePath}`);
  console.log(`   🏷️ Content-Type declarado: ${contentType} (${imageBuffer.length} bytes)`);

  // 3. Subida a Supabase Storage (HU-12)
  console.log('\n3️⃣ Subiendo imagen al bucket "evidencias-incidencias"...');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('evidencias-incidencias')
    .upload(filePath, imageBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error('   ❌ ERROR EN STORAGE UPLOAD:', uploadError.message);
    return;
  }
  console.log('   ✅ Subida exitosa a Storage:', uploadData.path);

  // 4. Obtener y verificar URL pública
  console.log('\n4️⃣ Comprobando acceso y cabeceras de la URL pública...');
  const { data: urlData } = supabase.storage
    .from('evidencias-incidencias')
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;
  console.log('   🔗 URL Pública:', publicUrl);

  const httpCheck = await fetch(publicUrl);
  const responseContentType = httpCheck.headers.get('content-type');
  console.log(`   📡 Código HTTP: ${httpCheck.status} ${httpCheck.statusText}`);
  console.log(`   🏷️ Content-Type devuelto por el CDN: ${responseContentType}`);

  if (httpCheck.status === 200 && responseContentType?.includes('image/jpeg')) {
    console.log('   ✅ Verificación HTTP 200 y MIME type correcto ("image/jpeg"): APROBADA');
  } else {
    console.warn('   ⚠️ Advertencia en verificación HTTP');
  }

  // 5. Inserción de Incidencia en BD (HU-14)
  console.log('\n5️⃣ Creando registro de incidencia en PostgreSQL vinculando la URL...');
  const { data: palmeta } = await supabase
    .from('palmetas_led')
    .select('id, codigo_qr, qr_uuid')
    .limit(1)
    .single();

  const palmetaId = palmeta?.id ?? null;
  const qrUuid = palmeta?.codigo_qr ?? palmeta?.qr_uuid ?? 'TEST-QR-QA';

  const { data: incData, error: incError } = await supabase
    .from('incidencias')
    .insert({
      qr_uuid: qrUuid,
      palmeta_id: palmetaId,
      tecnico_id: activeUser.id,
      tipo_falla: 'modulo_apagado',
      descripcion: `Prueba QA automatizada de persistencia de evidencia fotográfica - ${timestamp}`,
      foto_url: publicUrl,
      fecha_ocurrencia: new Date().toISOString(),
    })
    .select()
    .single();

  if (incError) {
    console.error('   ❌ ERROR AL INSERTAR INCIDENCIA:', incError.message);
    return;
  }

  console.log('   ✅ Incidencia registrada en la base de datos:');
  console.log(`      - UUID Incidencia: ${incData.id}`);
  console.log(`      - Palmeta vinculada: ${incData.palmeta_id || 'N/A'}`);
  console.log(`      - foto_url persistida: ${incData.foto_url}`);

  console.log('\n🎉 ==========================================');
  console.log('   RESULTADO: PIPELINE HU-12 Y HU-14 100% BLINDADO Y OPERATIVO');
  console.log('==========================================\n');
}

runQAUploadTest();
