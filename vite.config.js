import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      injectRegister: "auto",

      includeAssets: [
        "favicon.svg",
      ],

      manifest: {
        id: "/",

        name: "lifeOS",

        short_name: "lifeOS",

        description:
          "Sua vida, organizada em um só lugar.",

        lang: "pt-BR",

        start_url: "/",

        scope: "/",

        display: "standalone",

        orientation: "portrait-primary",

        background_color: "#f4f7fb",

        theme_color: "#5f92cc",

        categories: [
          "productivity",
          "lifestyle",
          "finance",
          "health",
        ],

        icons: [
          {
            src: "/favicon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/favicon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/favicon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,

        navigateFallback: "/index.html",

        globPatterns: [
          "**/*.{js,css,html,svg,png,ico,woff2}",
        ],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,

            handler: "NetworkOnly",
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
});