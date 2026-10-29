"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Sidebar } from "@/app/components/sidebar";
import { ThemeToggle } from "@/app/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--tx)] flex flex-col md:flex-row font-['Inter',sans-serif] selection:bg-[var(--sel-bg)] selection:text-[var(--sel-text)] transition-colors duration-200"
    >
      {/* Mobile Top Header (Visible only on < md screens, hidden on print) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--sf)] border-b border-[var(--bd)] sticky top-0 z-30 print:hidden">
        {/* Hamburger Menu Button (ON THE LEFT) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenMenu}
            aria-label="Abrir menú de navegación"
            className="w-10 h-10 rounded-xl bg-[var(--sf2)] border border-[var(--bd)] text-[var(--tx)] hover:text-[var(--pr)] flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <ThemeToggle />
        </div>

        {/* Brand / Logo (ON THE RIGHT) */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-inherit no-underline active:scale-95 transition-transform"
        >
          <div className="flex flex-col text-right">
            <span className="font-['Outfit'] font-black text-sm tracking-wider text-[var(--tx)]">
              ALEPROD
            </span>
            <span className="text-[10px] text-[var(--mu)] uppercase tracking-wider font-semibold">
              Panel Gerencial
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[var(--go)] text-[var(--gt)] flex items-center justify-center font-extrabold text-sm tracking-wider shadow-sm">
            AP
          </div>
        </Link>
      </header>

      {/* Universal Left Sidebar (Fixed on desktop, Drawer on mobile, hidden on print) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={handleCloseMenu}
      />

      {/* Main Viewport */}
      <div className="flex-1 min-w-0 flex flex-col w-full bg-app-gradient">
        {children}
      </div>
    </div>
  );
}
