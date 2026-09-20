import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: { port: 5176 },
  build: { outDir: "dist" },
});
