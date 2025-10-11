import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react(), tailwind()],
  server: {
    host: "0.0.0.0",
    port: 4321,
  },
  vite: {
    server: {
      allowedHosts: ["planwise-studio.de"],
    },
    build: {
      // Optimize bundle size
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "ui-vendor": ["framer-motion", "lucide-react"],
          },
        },
      },
    },
    define: {
      // Define process.env for browser compatibility
      "process.env": "{}",
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    },
    optimizeDeps: {
      exclude: ["dotenv", "mysql2", "mysql2/promise", "drizzle-orm"],
    },
    ssr: {
      noExternal: ["drizzle-orm"],
      external: ["mysql2", "mysql2/promise"],
    },
  },
  // Enable compression
  compressHTML: true,
  // Optimize images
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
});
