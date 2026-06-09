import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, "");
  const configuredBasePath =
    env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || "/";
  const basePath = configuredBasePath.startsWith("/") ? configuredBasePath : "/";

  return {
    plugins: [react(), tailwindcss()],
    envDir: configDir,
    base: basePath,
    resolve: {
      alias: {
        "@": path.resolve(configDir, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": "http://localhost",
        "/uploads": "http://localhost",
      },
    },
  };
});
