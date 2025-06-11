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
    'process.env': {}
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://sorttimes-backend.onrender.com'
          : 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
