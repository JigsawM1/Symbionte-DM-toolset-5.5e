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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
          }
          if (id.includes('Mounstros.2024-es.json')) {
            return 'datos-monstruos';
          }
          if (id.includes('all.json')) {
            return 'datos-conjuros';
          }
          if (
            id.includes('/src/constantes/') || id.includes('\\src\\constantes\\') ||
            id.includes('/src/utiles/compendios/') || id.includes('\\src\\utiles\\compendios\\') ||
            id.includes('/src/datos/') || id.includes('\\src\\datos\\')
          ) {
            return 'datos-compendio';
          }
        },
      },
    },
  }
});
