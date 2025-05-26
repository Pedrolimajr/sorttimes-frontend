import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    babel: {
      configFile: false,
      babelrc: false
    }
  })],
  define: {
    // Define variáveis globais para evitar erros de 'process is not defined'
    'process.env': {}
  },
  server: {
    proxy: {
      // Configura proxy para evitar problemas de CORS
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});