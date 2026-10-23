"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<string | null>(null);

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
    (process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http://") ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")) &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your_supabase_anon_key"
  );

  async function handleLoginSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    setStatusMessage("Verificando Privilegios de Dirección...");

    try {
      if (!isSupabaseConfigured) {
        // Modo Demo simulado según arquitectura de contingencia
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatusMessage("Autenticación Exitosa • Redirigiendo...");
        await new Promise((resolve) => setTimeout(resolve, 700));
        router.push("/");
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMessage(
          authError.message === "Invalid login credentials"
            ? "Credenciales no autorizadas. Verifica correo corporativo y clave maestra."
            : authError.message
        );
        setStatusMessage(null);
      } else {
        setStatusMessage("Autenticación Exitosa • Redirigiendo...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 600);
      }
    } catch {
      setErrorMessage("Error de conexión al servidor de autenticación.");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#131315] text-[#e5e1e4] flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 py-8 lg:py-14 select-none font-['Inter',sans-serif]">
      {/* ── Atmospheric Scrim & Ambient Glow Elements ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Warm golden chandelier backglow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[550px] bg-[#eec054]/10 rounded-full blur-[140px]" />
        {/* Deep floor infinity amber aura */}
        <div className="absolute -bottom-48 right-10 w-[500px] h-[450px] bg-[#654d01]/20 rounded-full blur-[150px]" />
        <div className="absolute -bottom-48 left-10 w-[450px] h-[450px] bg-[#353437]/30 rounded-full blur-[130px]" />
      </div>

      {/* ── Main Container ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Ultra-Lux Glassmorphism Card Frame with Asymmetric Luxury Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 bg-[#141418]/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden relative border border-[#3A3324]/60">
          {/* Top subtle gold rim light */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#eec054]/70 to-transparent z-20" />

          {/* LEFT COLUMN: Executive Operations & Production Infrastructure Overview (5 Cols) */}
          <div className="lg:col-span-5 relative flex flex-col justify-between p-8 sm:p-10 lg:p-12 overflow-hidden bg-[#0e0e10]">
            {/* Live Visual Stage Backdrop */}
            <div
              className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out hover:scale-100 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCrScB4Kv0Dc0i6dU9HToueM2M0U-7GauT2cxPOs3D97sbm22kXoEiyt4SH0RfPiPBMFT3ZuUj89NFy97dBtQwQbSWjdhoKTwye247iFoIXvSAtSKyN_M4pm-ypvTvjtcoyBdIoq7Ro-ABT0JOmPfddXMqBuBn6Zv1wtV3KH63-NFfXD7AHUFQA5FS8NFnO29cQFGDfU2rluThg8CtGkfcBZwmsJk_g7fnicXlmuHlQmaLRpnK9H_uc')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/85 to-[#0e0e10]/50 z-0" />

            {/* Upper Showcase Branding & Executive Identification */}
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#131315]/90 backdrop-blur-md shadow-md inline-flex items-center border border-[#3A3324]/70">
                  <img
                    alt="Alejandra Producciones Logo"
                    className="h-9 w-auto object-contain brightness-110"
                    src="https://lh3.googleusercontent.com/aida/AEtjO1VhD59IUPiobf3YTT2yIa8C86pYbC0AlKUfYQcG9_LbWfzIps7xhIICL7jtnP2YK3Lku_foGXgO-4FnTTqpfwKthLf7OwoPoE-8EPdznTiuKAlOvvt66rIrqTOTBZo3j6gjAxt7289wyrbeMgAsbNsGVQa8z52wx2LQV60mlRwKz2tRyH_i61mj6gDZIH0FFHSJF6WjfTNkJn043U7y0IlntM84ljmV-2SyItG5GEnH8UwA7jkOZNMhZCE"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Outfit'] uppercase tracking-widest text-[#eec054] text-[10px] font-bold">
                    Suite Central
                  </span>
                  <span className="font-['Outfit'] text-[#F7EEDB] text-base font-semibold">
                    Dirección &amp; Jefaturas
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#2a2a2c]/90 text-[#eec054] border border-[#eec054]/20 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#4E8752] inline-block animate-pulse" />
                <span className="font-['Outfit'] uppercase tracking-widest text-[#eec054] text-[10px] font-bold">
                  Sistema Operativo
                </span>
              </div>

              <div className="mt-3">
                <h2 className="font-['Outfit'] text-[#F7EEDB] text-2xl sm:text-3xl leading-snug font-medium">
                  Sistema Central de Gestión de Eventos &amp; Producción
                </h2>

              </div>
            </div>

            {/* Lower Production Security Status */}
            <div className="relative z-10 flex items-center justify-between text-xs text-[#d1c5b0]/70 pt-4 mt-6 border-t border-[#353437]/50">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4E8752] text-base">
                  verified_user
                </span>
                <span className="text-[11px] text-[#d1c5b0]">
                  Conexión Cifrada TLS 1.3
                </span>
              </div>
              <span className="font-['Outfit'] text-[#eec054]/90 tracking-widest uppercase text-[10px] font-semibold">
                AP-CORE-SYS v4.8
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: High-Security Executive Access Form (7 Cols) */}
          <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#1c1b1d]/95 relative">
            {/* Header / Security Level Banner */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 rounded bg-[#654d01]/40 text-[#e5c370] font-['Outfit'] tracking-wider uppercase inline-flex items-center gap-1.5 border border-[#e5c370]/30 text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-sm text-[#eec054]">
                    lock
                  </span>
                  ÁREA RESTRINGIDA • DIRECCIÓN Y JEFATURAS
                </span>
                <span className="text-xs text-[#d1c5b0]/70 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#4E8752] animate-pulse" />
                  Red Interna
                </span>
              </div>

              <h1 className="font-['Outfit'] text-[#F7EEDB] text-2xl sm:text-3xl font-medium tracking-tight mt-2">
                Iniciar Sesión en el Dashboard Gerencial
              </h1>

            </div>

            {/* Corporate Management Login Form */}
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleLoginSubmit}>
              {/* Input 1: Correo Corporativo */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-['Outfit'] uppercase tracking-wider text-[#d1c5b0] text-xs flex justify-between font-semibold"
                  htmlFor="identifier-input"
                >
                  <span>Correo Corporativo / Identificador de Jefatura</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d1c5b0] group-focus-within:text-[#eec054] transition-colors">
                    <span className="material-symbols-outlined text-xl">
                      account_circle
                    </span>
                  </div>
                  <input
                    id="identifier-input"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Hevstack@gmail.com"
                    className="w-full h-12 pl-11 pr-4 bg-[#141418] text-[#e5e1e4] rounded-lg text-sm placeholder:text-[#d1c5b0]/35 focus:outline-none focus:ring-1 focus:ring-[#eec054]/70 focus:bg-[#1E1E24] transition-all shadow-inner border border-[#3A3324]/70"
                  />
                </div>
              </div>

              {/* Input 2: Contraseña */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label
                    className="font-['Outfit'] uppercase tracking-wider text-[#d1c5b0] text-xs font-semibold"
                    htmlFor="password-input"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setInfoModal(
                        "Solicitud enviada a la mesa de soporte TI Interno. Un administrador se comunicará con tu terminal autorizada."
                      )
                    }
                    className="font-['Outfit'] text-[#e5c370] hover:text-[#eec054] transition-colors text-xs underline-offset-4 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tus credenciales?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d1c5b0] group-focus-within:text-[#eec054] transition-colors">
                    <span className="material-symbols-outlined text-xl">
                      password
                    </span>
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Contraseña"
                    className="w-full h-12 pl-11 pr-11 bg-[#141418] text-[#e5e1e4] rounded-lg text-sm placeholder:text-[#d1c5b0]/35 focus:outline-none focus:ring-1 focus:ring-[#eec054]/70 focus:bg-[#1E1E24] transition-all shadow-inner border border-[#3A3324]/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#d1c5b0]/60 hover:text-[#eec054] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Checkbox: Recordar terminal */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#d1c5b0] select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#141418] accent-[#eec054] cursor-pointer border border-[#3A3324]"
                  />
                  <span className="text-[12px] leading-tight">
                    Recordar terminal de trabajo seguro (30 días)
                  </span>
                </label>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#93000a]/20 border border-[#C24C44]/50 flex items-center gap-2.5 text-[#ffdad6] text-xs">
                  <span className="material-symbols-outlined text-[#C24C44] text-lg">
                    error
                  </span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                id="primary-login-btn"
                type="submit"
                disabled={loading}
                className={`w-full h-12 mt-2 rounded-lg text-[#3f2e00] font-['Outfit'] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer group active:scale-[0.99] font-semibold text-sm ${statusMessage?.includes("Autenticación Exitosa")
                  ? "bg-[#4E8752] text-white"
                  : "bg-[#cca138] hover:bg-[#eec054]"
                  }`}
              >
                <span>
                  {statusMessage || "INGRESAR AL DASHBOARD OPERATIVO"}
                </span>
                <span className="material-symbols-outlined text-lg transition-transform duration-200 group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Minimal Outer Trust Badges & Legal */}
        <div className="w-full mt-6 px-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#d1c5b0]/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-['Outfit'] uppercase tracking-wider text-[10px]">
              <span className="material-symbols-outlined text-xs text-[#eec054]">
                security
              </span>{" "}
              Sistema de Gestión Corporativa &amp; Logística Técnica
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px]">
              Alejandra Producciones SpA • Santiago, Chile
            </span>
            <span>•</span>
            <span className="text-[11px]">© 2025 Todos los derechos reservados.</span>
          </div>
        </div>
      </div>

      {/* Info Modal / Toast for credential recovery */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1c1b1d] border border-[#eec054]/40 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#eec054] text-2xl">
                support_agent
              </span>
              <h3 className="font-['Outfit'] text-[#F7EEDB] font-semibold text-lg">
                Mesa de Ayuda TI Interna
              </h3>
            </div>
            <p className="text-sm text-[#d1c5b0] leading-relaxed">
              {infoModal}
            </p>
            <button
              onClick={() => setInfoModal(null)}
              className="self-end px-5 py-2 rounded-lg bg-[#cca138] hover:bg-[#eec054] text-[#3f2e00] font-['Outfit'] font-semibold text-xs tracking-wider uppercase transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
