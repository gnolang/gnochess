import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
  build: {
    outDir: 'static',
    watch: {
      include: ['assets/js/**']
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'assets/js/main.ts')
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js'
      }
    }
  },
  plugins: []
});
