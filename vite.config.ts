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
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            if (id.includes('zustand') || id.includes('@tanstack/react-virtual')) {
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
