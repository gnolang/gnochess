import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
  build: {
    outDir: 'assets/dir',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'assets/js/main.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js'
      }
    }
  },
  plugins: []
});
