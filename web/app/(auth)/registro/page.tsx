"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistroTrabajadorPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  async function handleRegistroSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    if (!nombre.trim()) {
      setErrorMessage("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden. Verifícalas.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Registro en Supabase Auth
      const { data: authResult, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre_completo: nombre.trim(),
            rol: "tecnico",
            telefono: telefono.trim() || null,
          },
        },
      });

      if (authError) {
        setErrorMessage(authError.message);
        setLoading(false);
        return;
      }

      // 2. Asegurar inserción en tabla pública perfiles
      const newUserId = authResult.user?.id;
      if (newUserId) {
        const { error: perfilErr } = await supabase.from("perfiles").upsert({
          id: newUserId,
          nombre_completo: nombre.trim(),
          email: email.trim(),
          rol: "tecnico",
          telefono: telefono.trim() || null,
          activo: true,
        });

        if (perfilErr) {
          console.warn("Advertencia en perfiles:", perfilErr);
        }
      }

      setRegistroExitoso(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocurrió un error inesperado al procesar el registro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#D4AF37]/30 selection:text-[#FBBF24]">
      {/* Resplandor ambiental superior */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#D4AF37]/15 to-transparent rounded-full blur-[140px]" />
      </div>

      {/* Header simple */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] p-1.5 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Alejandra Producciones"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div>
            <span className="font-['Outfit'] font-bold text-sm tracking-wider text-white">
              ALEJANDRA PRODUCCIONES
            </span>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">
              Portal de Registro Técnico
            </span>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>¿Ya tienes cuenta?</span>
          <span className="text-[#D4AF37] hover:underline">Iniciar Sesión</span>
        </Link>
      </header>

      {/* Contenedor Central */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#111114] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          {registroExitoso ? (
            <div className="flex flex-col items-center text-center py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>

              <h2 className="font-['Outfit'] text-2xl font-bold text-white mb-1">
                ¡Cuenta Creada con Éxito!
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mb-6">
                Bienvenido al equipo técnico de Alejandra Producciones, <strong className="text-white">{nombre}</strong>. Tu cuenta está activa con rol de <strong className="text-emerald-400">Técnico en Terreno</strong>.
              </p>

              <div className="w-full p-4 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-2 text-left mb-6 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D4AF37]">smartphone</span>
                  <span><strong>Acceso móvil:</strong> Puedes abrir la app en tu teléfono o navegador móvil.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-400">qr_code_scanner</span>
                  <span><strong>Operación:</strong> Escaneo de palmetas LED y reporte de fallas en terreno.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <a
                  href="http://localhost:8081"
                  className="flex-1 h-11 rounded-xl bg-[#D4AF37] hover:bg-[#C5A059] text-black font-['Outfit'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D4AF37]/20"
                >
                  <span className="material-symbols-outlined text-base">install_mobile</span>
                  <span>Abrir App Móvil (PWA)</span>
                </a>
                <Link
                  href="/login"
                  className="h-11 px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  Ir al Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-xs font-semibold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  Invitación de Colaborador
                </span>
                <h1 className="font-['Outfit'] text-2xl font-bold text-white">
                  Crea tu Cuenta de Técnico
                </h1>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Completa tus datos para ingresar al sistema operativo de Alejandra Producciones.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRegistroSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Juan Pérez Morales"
                    className="h-10 px-3 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan.perez@aleprod.cl"
                    className="h-10 px-3 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Teléfono Celular / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="h-10 px-3 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full h-10 px-3 pr-9 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-11 rounded-xl bg-[#D4AF37] hover:bg-[#C5A059] text-black font-['Outfit'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#D4AF37]/15"
                >
                  <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>
                    {loading ? "progress_activity" : "person_add"}
                  </span>
                  <span>{loading ? "Creando Cuenta..." : "Registrarme como Técnico"}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-xs text-zinc-500">
        Alejandra Producciones SpA • Gestión y Operaciones Técnicas en Terreno
      </footer>
    </div>
  );
}

