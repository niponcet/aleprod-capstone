import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./components/dashboard-view";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Verificar sesión y autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Consultar perfil del usuario
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre_completo, rol")
    .eq("id", user.id)
    .single();

  // Consultar eventos activos y recientes
  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  // Consultar parque de palmetas
  const { data: palmetas } = await supabase
    .from("palmetas_led")
    .select("id, codigo_visible, qr_uuid, estado, ubicacion_actual")
    .order("codigo_visible", { ascending: true });

  // Consultar incidencias recientes
  const { data: incidencias } = await supabase
    .from("incidencias")
    .select("id, palmeta_id, qr_uuid, tipo_falla, resuelto, created_at, fecha_ocurrencia")
    .order("fecha_ocurrencia", { ascending: false });

  // Consultar repuestos
  const { data: repuestos } = await supabase
    .from("repuestos_inventario")
    .select("id, stock_actual, stock_minimo");

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
