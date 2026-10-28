import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Plantilla HTML raíz para Expo Web y PWA de Alejandra Producciones Terreno.
 * Configura Edge-to-Edge nativo en iOS Safari (modo standalone / PWA)
 * y erradica el auto-zoom en inputs/textareas/selects.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Reseteo nativo de scroll para Expo Router Web */}
        <ScrollViewStyleReset />

        {/* Estilos globales para Shell PWA Edge-to-Edge y anti auto-zoom */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                background-color: #0A0A0A !important;
                min-height: 100dvh;
                margin: 0;
                padding: 0;
                overscroll-behavior-y: none;
                -webkit-tap-highlight-color: transparent;
              }
              input, textarea, select {
                font-size: 16px !important;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
