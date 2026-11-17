"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "coordinador" | "tecnico";

export interface UsuarioPerfil {
  id: string;
  nombre_completo: string;
  email: string | null;
  rol: UserRole;
  telefono: string | null;
  activo: boolean;
  created_at: string;
  push_token?: string | null;
}

type FiltroRol = "todos" | "admin" | "coordinador" | "tecnico" | "inactivos";

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    sublabel: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    dotColor: string;
    avatarBg: string;
    avatarText: string;
    icon: string;
  }
> = {
  admin: {
    label: "Administrador Total",
    sublabel: "Control global del sistema y usuarios",
    badgeBg: "bg-[#F59E0B]/10 dark:bg-[#F59E0B]/15",
    badgeBorder: "border-[#F59E0B]/30",
    badgeText: "text-[#D97706] dark:text-[#FBBF24]",
    dotColor: "#F59E0B",
    avatarBg: "bg-[#F59E0B]",
    avatarText: "text-[#18181B]",
    icon: "shield_person",
  },
  coordinador: {
    label: "Coordinador de Producción",
    sublabel: "Gestión de eventos, taller e incidencias",
    badgeBg: "bg-[#3B82F6]/10 dark:bg-[#3B82F6]/15",
    badgeBorder: "border-[#3B82F6]/30",
    badgeText: "text-[#2563EB] dark:text-[#60A5FA]",
    dotColor: "#3B82F6",
    avatarBg: "bg-[#2563EB]",
    avatarText: "text-white",
    icon: "badge",
  },
  tecnico: {
    label: "Técnico de Terreno",
    sublabel: "Operación móvil, escaneo QR y 3 Taps",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    dotColor: "#10B981",
    avatarBg: "bg-[#10B981]",
    avatarText: "text-white",
    icon: "build",
  },
};

export default function UsuariosPage() {
  const supabase = useMemo(() => createClient(), []);

  /* ─── State ─── */
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroRol>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  /* ─── Modales ─── */
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalCambiarRolAbierto, setModalCambiarRolAbierto] = useState(false);
  const [modalCompartirAbierto, setModalCompartirAbierto] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [modoEnlace, setModoEnlace] = useState<"oficial" | "local">("oficial");
  const [usuarioParaEditarRol, setUsuarioParaEditarRol] = useState<UsuarioPerfil | null>(null);
  const [nuevoRolSeleccionado, setNuevoRolSeleccionado] = useState<UserRole>("tecnico");

  /* ─── Formulario Nuevo Usuario ─── */
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoRol, setNuevoRol] = useState<UserRole>("tecnico");
  const [nuevaPassword, setNuevaPassword] = useState("Aleprod2026!");
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const DOMINIO_OFICIAL = process.env.NEXT_PUBLIC_SITE_URL || "https://aleprod-web.vercel.app";

  const getRegistroUrl = (modo: "oficial" | "local" = modoEnlace) => {
    if (modo === "local" && typeof window !== "undefined") {
      return `${window.location.origin}/registro`;
    }
    // Enlace público canónico de producción (garantiza acceso desde celulares en terreno)
    return `${DOMINIO_OFICIAL.replace(/\/$/, "")}/registro`;
  };

  const handleCopiarEnlaceRegistro = async (modo: "oficial" | "local" = modoEnlace) => {
    const url = getRegistroUrl(modo);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setEnlaceCopiado(true);
      showToast(modo === "oficial" ? "¡Enlace oficial copiado (listo para WhatsApp)!" : "Enlace local copiado.");
      setTimeout(() => setEnlaceCopiado(false), 2500);
    } catch (err) {
      console.error("Error al copiar enlace:", err);
      showToast("Enlace disponible: " + url);
    }
  };

  /* ─── Fetch Usuarios ─── */
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Obtener usuario actual
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: miPerfil } = await supabase
          .from("perfiles")
          .select("id, nombre_completo, email, rol, telefono, activo, created_at, push_token")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (miPerfil) {
          setCurrentUserProfile(miPerfil as UsuarioPerfil);
        }
      }

      // 2. Obtener lista completa de perfiles
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre_completo, email, rol, telefono, activo, created_at, push_token")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error al cargar perfiles:", error);
      } else if (data) {
        setUsuarios(data as UsuarioPerfil[]);
      }
    } catch (err) {
      console.error("Fallo inesperado al consultar perfiles:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsuarios();

    // Suscripción en tiempo real a cambios en perfiles
    const channel = supabase
      .channel("usuarios-realtime-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "perfiles" }, () => {
        fetchUsuarios();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsuarios, supabase]);

  /* ─── Métricas ─── */
  const metricas = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.rol === "admin").length;
    const coordinadores = usuarios.filter((u) => u.rol === "coordinador").length;
    const tecnicos = usuarios.filter((u) => u.rol === "tecnico").length;
    const activos = usuarios.filter((u) => u.activo).length;
    const inactivos = usuarios.filter((u) => !u.activo).length;

    return { total, admins, coordinadores, tecnicos, activos, inactivos };
  }, [usuarios]);

  /* ─── Filtrado ─── */
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro de pestaña
      if (filtro === "admin" && u.rol !== "admin") return false;
      if (filtro === "coordinador" && u.rol !== "coordinador") return false;
      if (filtro === "tecnico" && u.rol !== "tecnico") return false;
      if (filtro === "inactivos" && u.activo) return false;

      // Filtro de búsqueda
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = u.nombre_completo.toLowerCase().includes(query);
        const coincideEmail = (u.email || "").toLowerCase().includes(query);
        const coincideTel = (u.telefono || "").toLowerCase().includes(query);
        const coincideRol = u.rol.toLowerCase().includes(query);
        return coincideNombre || coincideEmail || coincideTel || coincideRol;
      }

      return true;
    });
  }, [usuarios, filtro, busqueda]);

  /* ─── Acciones de Administrador ─── */
  const esAdmin = currentUserProfile?.rol === "admin";

  // Alternar Estado Activo / Inactivo
  const handleToggleActivo = async (usuario: UsuarioPerfil) => {
    if (!esAdmin) {
      alert("Solo los Administradores tienen permiso para suspender o activar cuentas.");
      return;
    }

    if (usuario.id === currentUserProfile?.id) {
      alert("No puedes desactivar tu propia cuenta de Administrador.");
      return;
    }

    setActionLoadingId(usuario.id);
    try {
      const nuevoEstado = !usuario.activo;
      const { error } = await supabase
        .from("perfiles")
        .update({ activo: nuevoEstado })
        .eq("id", usuario.id);

      if (error) {
        alert("Error al actualizar estado: " + error.message);
      } else {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === usuario.id ? { ...u, activo: nuevoEstado } : u))
        );
        showToast(
          nuevoEstado
            ? `Cuenta de ${usuario.nombre_completo} activada.`
            : `Cuenta de ${usuario.nombre_completo} suspendida.`
        );
      }
    } catch (err: any) {
      alert("Fallo inesperado: " + err?.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Abrir Modal Cambiar Rol
  const handleAbrirEditarRol = (usuario: UsuarioPerfil) => {
    if (!esAdmin) {
      alert("Solo los Administradores tienen permisos para cambiar roles.");
      return;
    }
    setUsuarioParaEditarRol(usuario);
    setNuevoRolSeleccionado(usuario.rol);
    setModalCambiarRolAbierto(true);
  };

  // Guardar Nuevo Rol
  const handleGuardarCambioRol = async () => {
    if (!usuarioParaEditarRol) return;

    if (usuarioParaEditarRol.id === currentUserProfile?.id && nuevoRolSeleccionado !== "admin") {
      alert("No puedes quitarte el rol de Administrador a ti mismo.");
      return;
    }

    setActionLoadingId(usuarioParaEditarRol.id);
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ rol: nuevoRolSeleccionado })
        .eq("id", usuarioParaEditarRol.id);

      if (error) {
        alert("Error al actualizar rol: " + error.message);
      } else {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioParaEditarRol.id ? { ...u, rol: nuevoRolSeleccionado } : u
          )
        );
        showToast(`Rol de ${usuarioParaEditarRol.nombre_completo} actualizado a ${ROLE_CONFIG[nuevoRolSeleccionado].label}.`);
        setModalCambiarRolAbierto(false);
      }
    } catch (err: any) {
      alert("Fallo inesperado: " + err?.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Guardar Nuevo Usuario
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFormulario(null);

    if (!nuevoNombre.trim()) {
      setErrorFormulario("Por favor ingresa el nombre completo.");
      return;
    }
    if (!nuevoEmail.trim() || !nuevoEmail.includes("@")) {
      setErrorFormulario("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (nuevaPassword.length < 6) {
      setErrorFormulario("La contraseña provisional debe tener al menos 6 caracteres.");
      return;
    }

    setGuardandoUsuario(true);
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authResult, error: authErr } = await supabase.auth.signUp({
        email: nuevoEmail.trim(),
        password: nuevaPassword,
        options: {
          data: {
            nombre_completo: nuevoNombre.trim(),
            rol: nuevoRol,
            telefono: nuevoTelefono.trim() || null,
          },
        },
      });

      if (authErr) {
        setErrorFormulario(authErr.message);
        setGuardandoUsuario(false);
        return;
      }

      const newUserId = authResult.user?.id;
      if (newUserId) {
        // 2. Asegurar inserción/actualización en perfiles
        const { error: perfilErr } = await supabase.from("perfiles").upsert({
          id: newUserId,
          nombre_completo: nuevoNombre.trim(),
          email: nuevoEmail.trim(),
          rol: nuevoRol,
          telefono: nuevoTelefono.trim() || null,
          activo: true,
        });

        if (perfilErr) {
          console.warn("Advertencia al upsert en perfiles:", perfilErr);
        }
      }

      showToast(`Colaborador ${nuevoNombre} registrado exitosamente como ${ROLE_CONFIG[nuevoRol].label}.`);
      setModalNuevoAbierto(false);
      // Limpiar formulario
      setNuevoNombre("");
      setNuevoEmail("");
      setNuevoTelefono("");
      setNuevoRol("tecnico");
      setNuevaPassword("Aleprod2026!");
      fetchUsuarios();
    } catch (err: any) {
      setErrorFormulario(err?.message || "Error al registrar nuevo usuario.");
    } finally {
      setGuardandoUsuario(false);
    }
  };

  return (
    <>
      {/* ── Resplandor Ambiental Superior ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--pr-glow)] rounded-full blur-[150px]" />
      </div>

      {/* ── Header Superior ── */}
      <header className="px-4 py-3 sm:px-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bd)] bg-[var(--sf)] sticky top-0 z-30">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              color: "var(--mu)",
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Inicio
          </Link>
          <span style={{ color: "var(--bd)", fontSize: "12px" }}>/</span>
          <span
            style={{
              fontSize: "14px",
              color: "var(--tx)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span className="material-symbols-outlined text-base" style={{ color: "var(--pr)" }}>
              manage_accounts
            </span>
            Gestión de Equipo y Control RBAC
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => fetchUsuarios()}
            disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[var(--bd)] bg-[var(--sf2)] text-[var(--tx)] text-xs font-semibold hover:border-[var(--border-light)] active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Recargar colaboradores"
          >
            <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {esAdmin && (
            <>
              <button
                type="button"
                onClick={() => setModalCompartirAbierto(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[var(--pr)]/30 bg-[var(--prs)] text-[var(--tx)] text-xs font-semibold hover:border-[var(--pr)] active:scale-95 transition-all shadow-sm cursor-pointer"
                title="Compartir enlace de registro para colaboradores"
              >
                <span className="material-symbols-outlined text-base text-[var(--pr)]">
                  share
                </span>
                <span className="hidden sm:inline">Enlace de Registro</span>
                <span className="sm:hidden">Enlace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorFormulario(null);
                  setModalNuevoAbierto(true);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--go)] text-[var(--gt)] text-xs font-bold active:scale-95 transition-all shadow-sm hover:brightness-105 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span className="hidden sm:inline">Nuevo Colaborador</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Toast de Confirmación ── */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Contenido Principal ── */}
      <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1">
        {/* Banner Operativo: Gestión de Accesos & Registro Autónomo */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-[var(--prs)] border border-[var(--pr)]/30 text-[var(--pr)] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xl">how_to_reg</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--tx)] m-0">
                  Gestión de Accesos & Auto-Registro de Técnicos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--prs)] text-[var(--pr)] border border-[var(--pr)]/20">
                  Activo
                </span>
              </div>
              <p className="text-xs text-[var(--mu)] mt-1 mb-0 leading-relaxed">
                Asigna cuentas directamente con credenciales provisorias o comparte el enlace de registro para que los colaboradores se den de alta en segundos. Si un trabajador deja de prestar servicios, inactívalo desde la tabla para bloquear su acceso web y móvil de inmediato.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleCopiarEnlaceRegistro("oficial")}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl border border-[var(--bd)] bg-[var(--sf2)] hover:border-[var(--pr)] text-xs font-semibold text-[var(--tx)] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-sm text-[var(--pr)]">
                {enlaceCopiado ? "check" : "content_copy"}
              </span>
              <span>{enlaceCopiado ? "¡Copiado!" : "Copiar Enlace"}</span>
            </button>
            <button
              type="button"
              onClick={() => setModalCompartirAbierto(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[var(--go)] text-[var(--gt)] text-xs font-bold hover:brightness-105 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>Invitar Colaborador</span>
            </button>
          </div>
        </div>
        {/* Cabecera y Contexto de Rol */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)] m-0">
              Personal Técnico y Accesos
            </h1>
            <p className="text-sm text-[var(--mu)] mt-1 mb-0">
              Administración de roles (Gerencia, Coordinación de Producción y Técnicos de Terreno)
            </p>
          </div>

          {/* Badge del Usuario Actual */}
          {currentUserProfile && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--bd)] bg-[var(--sf2)] shadow-sm">
              <span className="text-[11px] text-[var(--mu)] font-medium">Conectado como:</span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_CONFIG[currentUserProfile.rol].badgeBg} ${ROLE_CONFIG[currentUserProfile.rol].badgeText}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: ROLE_CONFIG[currentUserProfile.rol].dotColor }}
                />
                {ROLE_CONFIG[currentUserProfile.rol].label}
              </span>
            </div>
          )}
        </div>

        {/* ── 4 Tarjetas de Métricas (KPIs) ── */}
        <section aria-label="Métricas de equipo" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Personal */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] flex flex-col justify-between shadow-sm hover:border-[var(--border-light)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider">
                Total Equipo
              </span>
              <div className="w-8 h-8 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] flex items-center justify-center text-[var(--tx)]">
                <span className="material-symbols-outlined text-lg">groups</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-[var(--tx)] tabular-nums">
                {metricas.total}
              </div>
              <span className="text-[11.5px] text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {metricas.activos} en servicio activo
              </span>
            </div>
          </div>

          {/* Administradores */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[#F59E0B]/25 flex flex-col justify-between shadow-sm hover:border-[#F59E0B]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#D97706] dark:text-[#FBBF24] uppercase tracking-wider">
                Administradores
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                <span className="material-symbols-outlined text-lg">shield_person</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-[var(--tx)] tabular-nums">
                {metricas.admins}
              </div>
              <span className="text-[11.5px] text-[var(--mu)] font-medium mt-0.5 block">
                Dirección y control total
              </span>
            </div>
          </div>

          {/* Coordinadores */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-[#3B82F6]/25 flex flex-col justify-between shadow-sm hover:border-[#3B82F6]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider">
                Coordinadores
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
                <span className="material-symbols-outlined text-lg">badge</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-[var(--tx)] tabular-nums">
                {metricas.coordinadores}
              </div>
              <span className="text-[11.5px] text-[var(--mu)] font-medium mt-0.5 block">
                Jefatura de montajes y taller
              </span>
            </div>
          </div>

          {/* Técnicos en Terreno */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sf)] border border-emerald-500/25 flex flex-col justify-between shadow-sm hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Técnicos Terreno
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-lg">build</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-[var(--tx)] tabular-nums">
                {metricas.tecnicos}
              </div>
              <span className="text-[11.5px] text-[var(--mu)] font-medium mt-0.5 block">
                Operarios móviles (App 3 Taps)
              </span>
            </div>
          </div>
        </section>

        {/* ── Barra de Filtros y Búsqueda ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs Segmentados */}
          <div className="flex items-center gap-1 p-1 bg-[var(--sf)] border border-[var(--bd)] rounded-xl overflow-x-auto">
            {(
              [
                { id: "todos", label: "Todos", count: metricas.total },
                { id: "admin", label: "Admins", count: metricas.admins },
                { id: "coordinador", label: "Coordinadores", count: metricas.coordinadores },
                { id: "tecnico", label: "Técnicos", count: metricas.tecnicos },
                { id: "inactivos", label: "Inactivos", count: metricas.inactivos },
              ] as const
            ).map((tab) => {
              const activo = filtro === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltro(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activo
                      ? "bg-[var(--prs)] text-[var(--lk)] border border-[var(--pr)]/30 shadow-sm"
                      : "text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activo
                        ? "bg-[var(--go)] text-[var(--gt)]"
                        : "bg-[var(--sf2)] text-[var(--mu)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Input de Búsqueda */}
          <div className="relative min-w-[240px] sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--mu)]">
              search
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, email o rol..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-[var(--sf)] border border-[var(--bd)] text-xs text-[var(--tx)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-colors shadow-sm"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mu)] hover:text-[var(--tx)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Tabla Ejecutiva de Colaboradores ── */}
        <div className="bg-[var(--sf)] border border-[var(--bd)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--bd)] bg-[var(--sf2)]/50 text-[var(--mu)] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Colaborador</th>
                  <th className="py-3.5 px-4">Rol & Nivel RBAC</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Contacto</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bd)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--mu)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-3xl animate-spin text-[var(--pr)]">
                          progress_activity
                        </span>
                        <span className="text-xs font-medium">Cargando equipo de Alejandra Producciones...</span>
                      </div>
                    </td>
                  </tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--mu)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--sf2)] border border-[var(--bd)] flex items-center justify-center text-[var(--mu)]">
                          <span className="material-symbols-outlined text-2xl">person_search</span>
                        </div>
                        <span className="text-sm font-semibold text-[var(--tx)]">
                          No se encontraron colaboradores
                        </span>
                        <span className="text-xs text-[var(--mu)] max-w-sm">
                          {busqueda
                            ? `Ningún usuario coincide con "${busqueda}". Prueba con otro término.`
                            : "No hay registros disponibles en esta categoría."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const cfg = ROLE_CONFIG[u.rol] || ROLE_CONFIG.tecnico;
                    const esMiPropioUsuario = u.id === currentUserProfile?.id;
                    const procesando = actionLoadingId === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-[var(--sf2)]/50 transition-colors group"
                      >
                        {/* Colaborador */}
                        <td className="py-3.5 px-4 sm:px-6 align-middle">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${cfg.avatarBg} ${cfg.avatarText}`}
                            >
                              {u.nombre_completo.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--tx)] truncate">
                                  {u.nombre_completo}
                                </span>
                                {esMiPropioUsuario && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-[var(--prs)] text-[var(--lk)] border border-[var(--pr)]/30">
                                    TÚ
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-[var(--mu)] truncate">
                                {u.email || "Sin correo registrado"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Rol & Nivel RBAC */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}
                            >
                              <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                              {cfg.label}
                            </span>
                            <span className="text-[11px] text-[var(--mu)] hidden lg:inline">
                              {cfg.sublabel}
                            </span>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="py-3.5 px-4 hidden md:table-cell align-middle">
                          {u.telefono ? (
                            <a
                              href={`tel:${u.telefono}`}
                              className="text-xs text-[var(--tx)] hover:text-[var(--pr)] font-mono transition-colors flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm text-[var(--mu)]">
                                call
                              </span>
                              {u.telefono}
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--mu)]">No registrado</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          <div className="flex items-center justify-center">
                            {u.activo ? (
                              <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Suspendido
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            {esAdmin ? (
                              <>
                                {/* Botón Cambiar Rol */}
                                <button
                                  type="button"
                                  onClick={() => handleAbrirEditarRol(u)}
                                  disabled={procesando}
                                  title="Modificar rol y permisos"
                                  className="h-8 px-2.5 rounded-lg border border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:border-[var(--pr)] hover:text-[var(--pr)] text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                  <span className="hidden sm:inline">Rol</span>
                                </button>

                                {/* Botón Activar / Suspender */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleActivo(u)}
                                  disabled={procesando || esMiPropioUsuario}
                                  title={u.activo ? "Suspender acceso" : "Reactivar acceso"}
                                  className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 ${
                                    u.activo
                                      ? "border-[var(--bd)] bg-[var(--sf)] text-[var(--mu)] hover:text-red-400 hover:border-red-400/40 hover:bg-red-500/10"
                                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {u.activo ? "person_off" : "person_check"}
                                  </span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-[var(--mu)] italic px-2">
                                Solo lectura
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Modal: Registrar Nuevo Colaborador ── */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--sf)] border border-[var(--bd)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-[var(--bd)] flex items-center justify-between bg-[var(--sf2)]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--go)]/15 border border-[var(--pr)]/30 text-[var(--pr)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--tx)] m-0">
                    Registrar Nuevo Colaborador
                  </h3>
                  <p className="text-[11px] text-[var(--mu)] m-0">
                    Creación de credenciales y asignación de rol RBAC
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="w-8 h-8 rounded-lg border border-[var(--bd)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearUsuario} className="p-6 flex flex-col gap-4">
              {errorFormulario && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{errorFormulario}</span>
                </div>
              )}

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-semibold text-[var(--tx)] mb-1.5">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Marcelo Valenzuela"
                  className="w-full h-10 px-3.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-xs text-[var(--tx)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-colors"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-semibold text-[var(--tx)] mb-1.5">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  placeholder="ejemplo@aleprod.cl"
                  className="w-full h-10 px-3.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-xs text-[var(--tx)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-colors"
                />
              </div>

              {/* Selector de Rol */}
              <div>
                <label className="block text-xs font-semibold text-[var(--tx)] mb-1.5">
                  Rol y Nivel de Acceso <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: "tecnico", label: "Técnico", desc: "Móvil / Terreno" },
                      { id: "coordinador", label: "Coordinador", desc: "Eventos / Taller" },
                      { id: "admin", label: "Administrador", desc: "Control Total" },
                    ] as const
                  ).map((r) => {
                    const seleccionado = nuevoRol === r.id;
                    const cfg = ROLE_CONFIG[r.id];
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setNuevoRol(r.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          seleccionado
                            ? `${cfg.badgeBg} ${cfg.badgeBorder} ring-2 ring-[var(--pr)]/20`
                            : "bg-[var(--sf2)] border-[var(--bd)] hover:border-[var(--border-light)]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold ${seleccionado ? cfg.badgeText : "text-[var(--tx)]"}`}>
                            {r.label}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cfg.dotColor }}
                          />
                        </div>
                        <span className="text-[10.5px] text-[var(--mu)] mt-1">
                          {r.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teléfono y Contraseña en 2 Columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--tx)] mb-1.5">
                    Teléfono Móvil
                  </label>
                  <input
                    type="tel"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-xs text-[var(--tx)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--tx)] mb-1.5">
                    Contraseña Provisoria <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-xs text-[var(--tx)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--pr)] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Botones del Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 mt-2 border-t border-[var(--bd)]">
                <button
                  type="button"
                  onClick={() => setModalNuevoAbierto(false)}
                  disabled={guardandoUsuario}
                  className="h-10 px-4 rounded-xl border border-[var(--bd)] text-xs font-semibold text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoUsuario}
                  className="h-10 px-5 rounded-xl bg-[var(--go)] text-[var(--gt)] text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {guardandoUsuario ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">
                        progress_activity
                      </span>
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">check</span>
                      <span>Confirmar Alta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Modificar Rol de Colaborador ── */}
      {modalCambiarRolAbierto && usuarioParaEditarRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--sf)] border border-[var(--bd)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-[var(--bd)] flex items-center justify-between bg-[var(--sf2)]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">swap_horiz</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--tx)] m-0">
                    Cambiar Rol de Acceso
                  </h3>
                  <p className="text-[11px] text-[var(--mu)] m-0">
                    {usuarioParaEditarRol.nombre_completo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCambiarRolAbierto(false)}
                className="w-8 h-8 rounded-lg border border-[var(--bd)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Selector de Nuevo Rol */}
            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[var(--mu)] m-0">
                Selecciona el nuevo nivel de privilegios RBAC para este colaborador:
              </p>

              <div className="flex flex-col gap-2">
                {(
                  [
                    {
                      id: "admin",
                      label: "Administrador Total",
                      desc: "Acceso ilimitado al panel web, control de inventario, bajas y gestión de usuarios.",
                      icon: "shield_person",
                    },
                    {
                      id: "coordinador",
                      label: "Coordinador de Producción",
                      desc: "Gestión de eventos, asignación de técnicos, taller y resolución de incidencias.",
                      icon: "badge",
                    },
                    {
                      id: "tecnico",
                      label: "Técnico de Terreno",
                      desc: "Uso exclusivo de la App Móvil. Escaneo QR, reporte 3 Taps y checklist de eventos.",
                      icon: "build",
                    },
                  ] as const
                ).map((r) => {
                  const seleccionado = nuevoRolSeleccionado === r.id;
                  const cfg = ROLE_CONFIG[r.id];

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setNuevoRolSeleccionado(r.id)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        seleccionado
                          ? `${cfg.badgeBg} ${cfg.badgeBorder} ring-2 ring-[var(--pr)]/30`
                          : "bg-[var(--sf2)] border-[var(--bd)] hover:border-[var(--border-light)]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.avatarBg} ${cfg.avatarText}`}
                      >
                        <span className="material-symbols-outlined text-lg">{r.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${seleccionado ? cfg.badgeText : "text-[var(--tx)]"}`}>
                            {r.label}
                          </span>
                          {seleccionado && (
                            <span className="material-symbols-outlined text-base text-[var(--pr)]">
                              check_circle
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--mu)] mt-0.5 leading-relaxed m-0">
                          {r.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-3 mt-2 border-t border-[var(--bd)]">
                <button
                  type="button"
                  onClick={() => setModalCambiarRolAbierto(false)}
                  className="h-10 px-4 rounded-xl border border-[var(--bd)] text-xs font-semibold text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarCambioRol}
                  disabled={actionLoadingId === usuarioParaEditarRol.id}
                  className="h-10 px-5 rounded-xl bg-[var(--go)] text-[var(--gt)] text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === usuarioParaEditarRol.id ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">
                        progress_activity
                      </span>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      <span>Guardar Rol</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Compartir Enlace de Auto-Registro ── */}
      {modalCompartirAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--sf)] border border-[var(--bd)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-[var(--bd)] flex items-center justify-between bg-[var(--sf2)]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--go)]/15 border border-[var(--pr)]/30 text-[var(--pr)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">share</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--tx)] m-0">
                    Invitación y Enlace de Registro
                  </h3>
                  <p className="text-[11px] text-[var(--mu)] m-0">
                    Permite a los técnicos crear su cuenta de forma autónoma
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCompartirAbierto(false)}
                className="w-8 h-8 rounded-lg border border-[var(--bd)] text-[var(--mu)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[var(--mu)] leading-relaxed m-0">
                Comparte este enlace directamente con tus colaboradores o envíalo por WhatsApp. El trabajador completará su nombre, teléfono y contraseña, quedando listo para operar en la App Móvil.
              </p>

              {/* Selector de Entorno (Oficial Producción vs Local para desarrollo) */}
              <div className="flex items-center gap-1.5 p-1 bg-[var(--sf2)] rounded-xl border border-[var(--bd)] text-xs">
                <button
                  type="button"
                  onClick={() => setModoEnlace("oficial")}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    modoEnlace === "oficial"
                      ? "bg-[var(--prs)] text-[var(--lk)] border border-[var(--pr)]/30 shadow-sm"
                      : "text-[var(--mu)] hover:text-[var(--tx)]"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">public</span>
                  <span>Enlace Oficial (Producción)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoEnlace("local")}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    modoEnlace === "local"
                      ? "bg-[var(--sf)] text-[var(--tx)] border border-[var(--bd)] shadow-sm"
                      : "text-[var(--mu)] hover:text-[var(--tx)]"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">computer</span>
                  <span>Entorno Local</span>
                </button>
              </div>

              {/* Caja con URL copiable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--tx)]">
                    {modoEnlace === "oficial" ? "Enlace Público Oficial para Colaboradores" : "Enlace Local de Prueba"}
                  </label>
                  <span className="text-[10.5px] text-[var(--pr)] font-mono font-bold">
                    {modoEnlace === "oficial" ? "● Funciona en cualquier celular" : "● Solo accesible en tu máquina local"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-10 px-3.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] flex items-center text-xs text-[var(--tx)] font-mono overflow-x-auto select-all">
                    {getRegistroUrl(modoEnlace)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopiarEnlaceRegistro(modoEnlace)}
                    className="h-10 px-3.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] hover:border-[var(--pr)] text-xs font-bold text-[var(--tx)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm text-[var(--pr)]">
                      {enlaceCopiado ? "check" : "content_copy"}
                    </span>
                    <span>{enlaceCopiado ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              {/* Botón WhatsApp */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">chat</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--tx)] block">
                      Compartir por WhatsApp
                    </span>
                    <span className="text-[11px] text-[var(--mu)] block">
                      Abre chat con mensaje e invitación oficial (abre en cualquier celular)
                    </span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `¡Hola! Te comparto el enlace oficial para crear tu cuenta de colaborador en Alejandra Producciones:\n\n${getRegistroUrl("oficial")}\n\nAl registrarte podrás ingresar de inmediato a la aplicación móvil con tu correo y contraseña.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 no-underline shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Enviar por WhatsApp</span>
                </a>
              </div>

              {/* Recordatorios de Seguridad y Gestión */}
              <div className="p-3.5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] flex flex-col gap-2 text-[11px] text-[var(--mu)]">
                <div className="flex items-center gap-2 text-[var(--tx)] font-semibold">
                  <span className="material-symbols-outlined text-base text-[var(--pr)]">info</span>
                  <span>Control de Seguridad y Accesos</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 m-0">
                  <li>
                    Todo usuario registrado mediante enlace recibe por defecto el rol de <strong>Técnico de Terreno</strong>.
                  </li>
                  <li>
                    Aparecerá en tiempo real en esta tabla, desde donde puedes cambiar su rol a Coordinador o Administrador.
                  </li>
                  <li>
                    <strong>Inhabilitación inmediata:</strong> Si un trabajador se desvincula o ya no debe acceder, pulsa el botón de suspender en la tabla para bloquear su sesión al instante.
                  </li>
                </ul>
              </div>

              {/* Botón Cerrar */}
              <div className="flex items-center justify-end pt-2 border-t border-[var(--bd)]">
                <button
                  type="button"
                  onClick={() => setModalCompartirAbierto(false)}
                  className="h-10 px-5 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-xs font-semibold text-[var(--tx)] hover:bg-[var(--bd)]/30 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

