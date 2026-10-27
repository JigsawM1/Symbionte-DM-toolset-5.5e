import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
          }
          if (id.includes('/src/constantes/') || id.includes('\\src\\constantes\\')) {
            return 'datos-compendio';
          }
        },
      },
    },
  }
});
