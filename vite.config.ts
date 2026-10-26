import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

declare const process: { env: Record<string, string | undefined> };

function prerenderDeckInDev(): Plugin {
  return {
    name: "prerender-deck-in-dev",
    transformIndexHtml: {
      order: "pre",
      async handler(html, context) {
        const filename = context.filename.replace(/\\/g, "/");
        if (!context.server || !filename.endsWith("/deck/index.html")) {
          return html;
        }

        const rootPlaceholder = /<div id="root"><\/div>/;
        if (!rootPlaceholder.test(html)) return html;

        const { default: DeckPage } = await context.server.ssrLoadModule(
          "/src/deck/DeckPage.tsx",
        );
        const renderedDeck = renderToString(
          createElement(StrictMode, null, createElement(DeckPage)),
        );
        return html.replace(
          rootPlaceholder,
          `<div id="root">${renderedDeck}</div>`,
        );
      },
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), prerenderDeckInDev()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: ["**/.local/**", "**/.git/**", "**/.cache/**", "**/.agents/**"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        deck: fileURLToPath(new URL("./deck/index.html", import.meta.url)),
      },
    },
  },
});
