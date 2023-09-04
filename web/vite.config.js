import { defineConfig } from "vite";
import * as path from "path";

export default defineConfig({
  build: {
    outDir: "static",
    watch: {
      include: ["assets/js/**"],
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "assets/js/main.ts"),
        // css: path.resolve(__dirname, "assets/css/main.css"),
      },
      output: {
        entryFileNames: "js/[name].js",
        chunkFileNames: "js/[name].js",
        // assetFileNames: "css/[name].[ext]",
      },
    },
  },
  plugins: [],
});
