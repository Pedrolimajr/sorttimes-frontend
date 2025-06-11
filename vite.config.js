import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do arquivo .env
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    // Define as variáveis de ambiente de forma segura
    define: {
      __MODE__: JSON.stringify(mode),
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
    }
  };
});