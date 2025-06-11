import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Define variáveis globais para evitar erros de 'process is not defined'
    'process.env': {}
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://sorttimes-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});