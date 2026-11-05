import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alejandra Producciones — Panel Administrativo",
  description:
    "Sistema de gestión operativa e inventario de palmetas LED para eventos de alto estándar.",
  icons: {
    icon: [
      { url: "/favicon.svg?v=aleprod3", type: "image/svg+xml" },
      { url: "/favicon-32.png?v=aleprod3", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png?v=aleprod3", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico?v=aleprod3" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=aleprod3", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=aleprod3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aleprod-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;var c=t==='light'?'light':(t==='dark'?'dark':(p?'dark':'dark'));document.documentElement.setAttribute('data-theme',c);document.documentElement.classList.add(c);if(c==='dark'){document.documentElement.classList.remove('light');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Preload de fuente local de iconos para renderizado instantáneo sin red externa */}
        <link
          rel="preload"
          href="/fonts/material-symbols.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Preload de imagen del logotipo de marca */}
        <link rel="preload" href="/icons/icon-192.png" as="image" />
        {/* Favicons con versión para refresco inmediato de caché en navegador */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=aleprod3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=aleprod3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=aleprod3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=aleprod3" />
        <link rel="shortcut icon" href="/favicon.ico?v=aleprod3" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
