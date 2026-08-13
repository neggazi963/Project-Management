import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => ({
  plugins: [reactRouter(), tailwindcss()],

  base: command === "serve" ? "/" : "./",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
}));
