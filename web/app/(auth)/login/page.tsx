"use client";

import { useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
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

  // Generación matemática de la cuadrícula de palmetas LED (10x15 = 150 celdas)
  const tiles = useMemo(() => {
    const list: Array<{ style: React.CSSProperties }> = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 10; c++) {
        const dr = r - 3;
        const dc = c - 7;
        const d = Math.sqrt(dr * dr + dc * dc);
        const fall = Math.max(0, 1 - d / 8);
        const wave = 0.55 + 0.45 * Math.sin(r * 1.7 + c * 1.3);
        const a = fall * wave;
        const gold = ((r * 7 + c * 3) % 17) === 0 && a > 0.2;
        const rgb = gold ? "245,197,24" : "236,239,246";
        const alpha = gold ? (0.25 + a * 0.45).toFixed(3) : (0.03 + a * 0.3).toFixed(3);

        const style: React.CSSProperties = {
          borderRadius: "6px",
          aspectRatio: "1 / 1",
          background: `rgba(${rgb}, ${alpha})`,
          border: "1px solid rgba(255,255,255,0.05)",
          animationDelay: `-${((r * 0.37 + c * 0.23) % 5.2).toFixed(2)}s`,
        };

        if (a > 0.45) {
          style.boxShadow = `0 0 20px rgba(${rgb}, ${(a * 0.18).toFixed(2)})`;
        }

        list.push({ style });
      }
    }
    return list;
  }, []);

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
    setStatusMessage("Verificando credenciales...");

    try {
      if (!isSupabaseConfigured) {
        // Modo contingencia demo
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatusMessage("Acceso concedido • Redirigiendo...");
        await new Promise((resolve) => setTimeout(resolve, 600));
        router.push("/");
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setErrorMessage(
          authError.message === "Invalid login credentials"
            ? "Credenciales no autorizadas. Verifica tu correo y clave."
            : authError.message
        );
        setStatusMessage(null);
      } else {
        setStatusMessage("Acceso concedido • Redirigiendo...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 500);
      }
    } catch {
      setErrorMessage("Error de conexión al servidor de autenticación.");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-theme="dark"
      className="h-screen h-[100dvh] w-full overflow-hidden flex flex-row items-stretch font-['Inter',system-ui,-apple-system,sans-serif] selection:bg-[#F5C518]/20 selection:text-[#F5C518]"
      style={{
        background: "var(--bg)",
        color: "var(--tx)",
      }}
    >
      <style jsx global>{`
        [data-theme="dark"] {
          --bg: #0A0C12;
          --sf: #11141B;
          --sf2: #181C26;
          --bd: #2A3040;
          --tx: #F2F4F8;
          --mu: #9BA3B5;
          --ring: rgba(255, 255, 255, 0.14);
          --ok: #34D399;
          --go: #F5C518;
          --gt: #1A1405;
          --ease: cubic-bezier(0.23, 1, 0.32, 1);
        }
        .login-btn {
          transition: transform 160ms var(--ease), filter 160ms var(--ease);
        }
        .login-btn:hover {
          filter: brightness(1.06);
        }
        .login-btn:active {
          transform: scale(0.97);
        }
        .login-ghost {
          transition: background-color 160ms var(--ease), transform 160ms var(--ease);
        }
        .login-ghost:hover {
          background: var(--sf2);
        }
        .login-ghost:active {
          transform: scale(0.95);
        }
        .login-field {
          transition: border-color 150ms var(--ease), box-shadow 150ms var(--ease);
        }
        .login-field:focus {
          outline: none;
          border-color: var(--tx);
          box-shadow: 0 0 0 3px var(--ring);
        }
        .login-rise {
          animation: loginRise 460ms var(--ease) both;
        }
        @keyframes loginRise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .login-led {
          animation: loginLed 5.2s ease-in-out infinite;
        }
        @keyframes loginLed {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-rise, .login-led {
            animation: none !important;
          }
          .login-btn, .login-ghost, .login-field {
            transition: none !important;
          }
        }
      `}</style>

      {/* ============ BRAND · 40% (VISIBLE SOLO EN ESCRITORIO >= lg) ============ */}
      <section
        className="hidden lg:flex flex-[4_1_380px] h-full overflow-hidden relative box-border bg-[#08090D] text-[#F4F4F6] p-8 xl:p-12 flex-col justify-between"
      >
        {/* Animated LED Matrix Simulation */}
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-10 gap-1.5 p-1.5 content-start pointer-events-none"
        >
          {tiles.map((t, idx) => (
            <div key={idx} className="login-led" style={t.style} />
          ))}
        </div>

        {/* Ambient Gradient Overlap */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(190deg, rgba(8,9,13,0) 18%, rgba(8,9,13,.95) 66%)",
          }}
        />

        {/* Top Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#08090D]/75 border border-white/15 text-[11.5px] font-bold tracking-[0.08em] text-[#E6E8EE] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            SISTEMA OPERATIVO
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-[#08090D]/75 border border-white/15 text-[11.5px] font-semibold tracking-[0.08em] text-[#B8BDC9] backdrop-blur-md">
            AP-CORE-SYS V4.8
          </span>
        </div>

        {/* Main Brand Messaging & Capabilities */}
        <div className="relative z-10 flex flex-col gap-6 xl:gap-8">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold tracking-[0.14em] text-[#9EA4B3] uppercase">
              SISTEMA CENTRAL DE GESTIÓN
            </span>
            <h2 className="m-0 text-3xl xl:text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              Eventos y producción, bajo control.
            </h2>
          </div>

          <ul className="list-none m-0 p-0 flex flex-col">
            {/* Feature 1 */}
            <li className="flex gap-4 items-start py-3 xl:py-3.5 border-t border-white/12">
              <span className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-white/[0.07] text-[#E8EAF0] flex items-center justify-center flex-none border border-white/5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12h4l3-8 4 16 3-8h4" />
                </svg>
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] xl:text-[15px] font-bold text-white">Control en tiempo real</span>
                <span className="text-[12.5px] xl:text-[13px] leading-relaxed text-[#A4A9B6]">
                  Sabe qué montaje está activo y cómo avanza cada turno.
                </span>
              </div>
            </li>

            {/* Feature 2 */}
            <li className="flex gap-4 items-start py-3 xl:py-3.5 border-t border-white/12">
              <span className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-white/[0.07] text-[#E8EAF0] flex items-center justify-center flex-none border border-white/5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="4" width="14" height="17" rx="2" />
                  <path d="M9 4V3h6v1M9 13l2 2 4-4" />
                </svg>
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] xl:text-[15px] font-bold text-white">Trazabilidad de cada falla</span>
                <span className="text-[12.5px] xl:text-[13px] leading-relaxed text-[#A4A9B6]">
                  Las incidencias reportadas en terreno quedan registradas.
                </span>
              </div>
            </li>

            {/* Feature 3 */}
            <li className="flex gap-4 items-start py-3 xl:py-3.5 border-t border-white/12">
              <span className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-white/[0.07] text-[#E8EAF0] flex items-center justify-center flex-none border border-white/5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
                  <path d="m3.3 7.5 8.7 5 8.7-5M12 22V12.5" />
                </svg>
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] xl:text-[15px] font-bold text-white">Inventario siempre al día</span>
                <span className="text-[12.5px] xl:text-[13px] leading-relaxed text-[#A4A9B6]">
                  Estado de palmetas y repuestos, actualizado desde terreno.
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ============ FORM · PANTALLA COMPLETA EN MÓVIL / 60% EN ESCRITORIO ============ */}
      <section
        className="flex-1 lg:flex-[6_1_520px] h-full overflow-y-auto lg:overflow-hidden box-border p-5 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between"
        style={{ background: "var(--sf)" }}
      >
        {/* Top Header inside Form Panel (Logo corporativo sin iconos de sol/luna) */}
        <div className="login-rise flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base tracking-wide flex-shrink-0 shadow-sm"
              style={{
                background: "var(--tx)",
                color: "var(--bg)",
              }}
            >
              AP
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] sm:text-[15px] font-bold leading-tight">Alejandra Producciones</span>
              <span className="text-[11px] sm:text-xs" style={{ color: "var(--mu)" }}>
                Suite central · Dirección y jefaturas
              </span>
            </div>
          </div>
        </div>

        {/* Center Main Form */}
        <main className="flex-1 flex flex-col justify-center py-2 sm:py-4 my-auto">
          <div className="w-full max-w-[420px] mx-auto flex flex-col gap-5 sm:gap-6">
            {/* Title Section */}
            <div className="flex flex-col gap-2.5">
              <span
                className="login-rise self-start inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.08em] border"
                style={{
                  animationDelay: "50ms",
                  background: "var(--sf2)",
                  borderColor: "var(--bd)",
                  color: "var(--mu)",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                ÁREA RESTRINGIDA
              </span>

              <h1
                className="login-rise m-0 text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-[-0.03em] leading-[1.1]"
                style={{ animationDelay: "90ms" }}
              >
                Inicia sesión en tu panel
              </h1>

              <p
                className="login-rise m-0 text-xs sm:text-sm leading-relaxed"
                style={{ animationDelay: "130ms", color: "var(--mu)" }}
              >
                Ingresa con tu correo corporativo para supervisar eventos, palmetas LED, incidencias y repuestos.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              {/* Correo Corporativo */}
              <div
                className="login-rise flex flex-col gap-1.5"
                style={{ animationDelay: "170ms" }}
              >
                <label htmlFor="mail" className="text-xs sm:text-[13px] font-semibold">
                  Correo corporativo
                </label>
                <div className="relative">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--mu)"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="absolute left-3.5 top-[15px] pointer-events-none"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  <input
                    id="mail"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@aleprod.cl"
                    className="login-field w-full h-12 pl-11 pr-4 rounded-xl text-sm border font-inherit box-border"
                    style={{
                      background: "var(--sf2)",
                      borderColor: "var(--bd)",
                      color: "var(--tx)",
                    }}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div
                className="login-rise flex flex-col gap-1.5"
                style={{ animationDelay: "210ms" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="pass" className="text-xs sm:text-[13px] font-semibold">
                    Contraseña
                  </label>
                  <Link
                    href="/recuperar"
                    className="text-xs sm:text-[13px] font-semibold hover:underline transition-opacity"
                    style={{ color: "var(--mu)" }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <div className="relative">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--mu)"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="absolute left-3.5 top-[15px] pointer-events-none"
                  >
                    <circle cx="8" cy="15" r="4" />
                    <path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2" />
                  </svg>
                  <input
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="login-field w-full h-12 pl-11 pr-12 rounded-xl text-sm border font-inherit box-border"
                    style={{
                      background: "var(--sf2)",
                      borderColor: "var(--bd)",
                      color: "var(--tx)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="login-ghost absolute right-1 top-1 w-10 h-10 rounded-lg border-0 bg-transparent flex items-center justify-center cursor-pointer"
                    style={{ color: "var(--mu)" }}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9.9 5.2A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6M3 3l18 18" />
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox: Recordar terminal */}
              <label
                className="login-rise flex items-center gap-2.5 text-xs sm:text-sm select-none cursor-pointer py-0.5"
                style={{ animationDelay: "250ms", color: "var(--mu)" }}
              >
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer m-0"
                  style={{ accentColor: "var(--tx)" }}
                />
                <span>Recordar este equipo seguro (30 días)</span>
              </label>

              {/* Error Banner */}
              {errorMessage && (
                <div
                  className="p-3 rounded-xl text-xs font-medium flex items-center gap-2.5 border animate-in fade-in"
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "#F87171",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-none"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-btn login-rise w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm sm:text-[15px] border-0 cursor-pointer shadow-md disabled:opacity-60"
                style={{
                  animationDelay: "290ms",
                  background: "var(--go)",
                  color: "var(--gt)",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{statusMessage || "Iniciando sesión..."}</span>
                  </span>
                ) : (
                  <>
                    <span>Ingresar al panel</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Security Footnote */}
            <div
              className="login-rise flex items-center gap-2 pt-3 border-t text-[11.5px] sm:text-xs"
              style={{
                animationDelay: "330ms",
                borderColor: "var(--bd)",
                color: "var(--mu)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ok)"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="flex-none"
              >
                <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Conexión cifrada TLS 1.3 · Acceso exclusivo para personal autorizado</span>
            </div>
          </div>
        </main>

        {/* Form Panel Footer */}
        <footer
          className="flex flex-wrap gap-2 justify-between text-[11px] sm:text-xs pt-2"
          style={{ color: "var(--mu)" }}
        >
          <span>© 2026 Alejandra Producciones SpA</span>
          <span>Santiago, Chile</span>
        </footer>
      </section>
    </div>
  );
}
