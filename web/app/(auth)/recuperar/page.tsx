"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleResetSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const redirectTo = `${origin}/auth/callback?next=/actualizar-contrasena`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setErrorMessage(
          error.message === "User not found"
            ? "No se encontró una cuenta asociada a este correo corporativo."
            : error.message
        );
      } else {
        setSuccessMessage(
          "Revisa tu bandeja de entrada. Hemos enviado un enlace seguro para restablecer tu contraseña."
        );
      }
    } catch {
      setErrorMessage("Error de conexión al servidor de autenticación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#131315] text-[#e5e1e4] flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 py-8 lg:py-14 select-none font-['Inter',sans-serif]">
      {/* ── Atmospheric Scrim & Ambient Glow Elements ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[550px] bg-[#eec054]/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-48 right-10 w-[500px] h-[450px] bg-[#654d01]/20 rounded-full blur-[150px]" />
        <div className="absolute -bottom-48 left-10 w-[450px] h-[450px] bg-[#353437]/30 rounded-full blur-[130px]" />
      </div>

      {/* ── Main Container ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Ultra-Lux Glassmorphism Card Frame */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 bg-[#141418]/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden relative border border-[#3A3324]/60">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#eec054]/70 to-transparent z-20" />

          {/* LEFT COLUMN: Executive Identity Overview (5 Cols) */}
          <div className="lg:col-span-5 relative flex flex-col justify-between p-8 sm:p-10 lg:p-12 overflow-hidden bg-[#0e0e10]">
            {/* Visual Stage Backdrop */}
            <div
              className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out hover:scale-100 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCrScB4Kv0Dc0i6dU9HToueM2M0U-7GauT2cxPOs3D97sbm22kXoEiyt4SH0RfPiPBMFT3ZuUj89NFy97dBtQwQbSWjdhoKTwye247iFoIXvSAtSKyN_M4pm-ypvTvjtcoyBdIoq7Ro-ABT0JOmPfddXMqBuBn6Zv1wtV3KH63-NFfXD7AHUFQA5FS8NFnO29cQFGDfU2rluThg8CtGkfcBZwmsJk_g7fnicXlmuHlQmaLRpnK9H_uc')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/85 to-[#0e0e10]/50 z-0" />

            {/* Upper Branding */}
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
                    Recuperación de Acceso
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#2a2a2c]/90 text-[#eec054] border border-[#eec054]/20 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#cca138] inline-block animate-pulse" />
                <span className="font-['Outfit'] uppercase tracking-widest text-[#eec054] text-[10px] font-bold">
                  Seguridad de Credenciales
                </span>
              </div>

              <div className="mt-3">
                <h2 className="font-['Outfit'] text-[#F7EEDB] text-2xl sm:text-3xl leading-snug font-medium">
                  Restaura tu contraseña corporativa
                </h2>
                <p className="text-xs text-[#d1c5b0]/80 mt-2 leading-relaxed">
                  Ingresa tu correo institucional registrado. Te enviaremos un enlace criptográfico seguro con token temporal para generar una nueva clave.
                </p>
              </div>
            </div>

            {/* Lower Status */}
            <div className="relative z-10 flex items-center justify-between text-xs text-[#d1c5b0]/70 pt-4 mt-6 border-t border-[#353437]/50">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4E8752] text-base">
                  lock_reset
                </span>
                <span className="text-[11px] text-[#d1c5b0]">
                  Protocolo PKCE Seguro
                </span>
              </div>
              <span className="font-['Outfit'] text-[#eec054]/90 tracking-widest uppercase text-[10px] font-semibold">
                AP-AUTH-RECOVERY
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Recovery Form (7 Cols) */}
          <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#1c1b1d]/95 relative">
            <div>
              {/* Security Level Banner */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 rounded bg-[#654d01]/40 text-[#e5c370] font-['Outfit'] tracking-wider uppercase inline-flex items-center gap-1.5 border border-[#e5c370]/30 text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-sm text-[#eec054]">
                    mail_lock
                  </span>
                  ENVÍO DE ENLACE DE RECUPERACIÓN
                </span>
                <Link
                  href="/login"
                  className="text-xs text-[#d1c5b0] hover:text-[#eec054] transition-colors flex items-center gap-1 font-['Outfit'] font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Volver al Login
                </Link>
              </div>

              <h1 className="font-['Outfit'] text-[#F7EEDB] text-2xl sm:text-3xl font-medium tracking-tight mt-3">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-xs text-[#d1c5b0]/70 mt-1">
                Ingresa tu correo electrónico para recibir las instrucciones de restablecimiento.
              </p>

              {/* Recovery Form */}
              <form className="mt-7 flex flex-col gap-4" onSubmit={handleResetSubmit}>
                {/* Email Input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-['Outfit'] uppercase tracking-wider text-[#d1c5b0] text-xs font-semibold"
                    htmlFor="recovery-email-input"
                  >
                    Correo Corporativo
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d1c5b0] group-focus-within:text-[#eec054] transition-colors">
                      <span className="material-symbols-outlined text-xl">
                        mail
                      </span>
                    </div>
                    <input
                      id="recovery-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="nombre@aleprod.cl"
                      className="w-full h-12 pl-11 pr-4 bg-[#141418] text-[#e5e1e4] rounded-lg text-[16px] md:text-sm placeholder:text-[#d1c5b0]/35 focus:outline-none focus:ring-1 focus:ring-[#eec054]/70 focus:bg-[#1E1E24] transition-all shadow-inner border border-[#3A3324]/70"
                    />
                  </div>
                </div>

                {/* Success Message Alert */}
                {successMessage && (
                  <div className="p-3.5 rounded-xl bg-[#4E8752]/20 border border-[#4E8752]/50 flex items-start gap-2.5 text-[#e5f5e6] text-xs leading-relaxed animate-fade-in-up">
                    <span className="material-symbols-outlined text-[#4E8752] text-lg mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Error Alert */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-[#93000a]/20 border border-[#C24C44]/50 flex items-center gap-2.5 text-[#ffdad6] text-xs animate-fade-in-up">
                    <span className="material-symbols-outlined text-[#C24C44] text-lg shrink-0">
                      error
                    </span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !!successMessage}
                  className={`w-full h-12 mt-2 rounded-lg text-[#3f2e00] font-['Outfit'] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer group active:scale-[0.99] font-semibold text-sm ${
                    successMessage
                      ? "bg-[#4E8752] text-white cursor-default"
                      : "bg-[#cca138] hover:bg-[#eec054] disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#3f2e00] border-t-transparent rounded-full animate-spin" />
                      <span>Enviando enlace...</span>
                    </>
                  ) : successMessage ? (
                    <>
                      <span className="material-symbols-outlined text-base">mark_email_read</span>
                      <span>Enlace Enviado con Éxito</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar enlace de recuperación</span>
                      <span className="material-symbols-outlined text-lg transition-transform duration-200 group-hover:translate-x-1">
                        send
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Back to Login Footer */}
            <div className="pt-6 border-t border-[#353437]/50 mt-6 flex items-center justify-between text-xs text-[#d1c5b0]/60">
              <Link
                href="/login"
                className="font-['Outfit'] text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                ¿Ya recordaste tu clave? Inicia sesión
              </Link>
              <span className="text-[11px] text-[#71717A]">Soporte TI • Aleprod</span>
            </div>
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
    </div>
  );
}
