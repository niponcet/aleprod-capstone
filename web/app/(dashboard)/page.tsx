import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/app/components/dashboard-view";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Verificar sesión y autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Consultar todos los datos en paralelo simultáneamente para eliminar la cascada de latencia
  const [
    { data: perfil },
    { data: eventos },
    { data: palmetas },
    { data: incidencias },
    { data: repuestos },
  ] = await Promise.all([
    supabase
      .from("perfiles")
      .select("nombre_completo, rol")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("eventos")
      .select("*")
      .order("fecha_inicio", { ascending: false }),
    supabase
      .from("palmetas_led")
      .select("id, codigo_visible, qr_uuid, estado, ubicacion_actual")
      .order("codigo_visible", { ascending: true }),
    supabase
      .from("incidencias")
      .select("id, palmeta_id, qr_uuid, tipo_falla, resuelto, created_at, fecha_ocurrencia")
      .order("fecha_ocurrencia", { ascending: false }),
    supabase
      .from("repuestos_inventario")
      .select("id, stock_actual, stock_minimo"),
  ]);

  return (
    <DashboardView
      user={{ id: user.id, email: user.email }}
      perfil={perfil}
      initialEventos={eventos || []}
      initialPalmetas={palmetas || []}
      initialIncidencias={incidencias || []}
      initialRepuestos={repuestos || []}
    />
  );
}
