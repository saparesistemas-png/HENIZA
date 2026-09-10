import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // O preview usa o Express como servidor principal; desativar o cliente HMR
    // evita conexões WebSocket órfãs no host de preview.
    hmr: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
