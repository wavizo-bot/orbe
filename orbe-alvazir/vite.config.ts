import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  server: { port: 5176 },
  build: { outDir: "dist" },
  resolve: {
    alias: {
      "@orbe": resolve(__dirname, "../compartilhado/src"),
    },
  },
});
