import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      // Em desenvolvimento, /api/... é encaminhado ao back-end (sem CORS).
      // Para outro endereço, crie um arquivo .env.local com:
      //   VITE_PROXY_TARGET=http://IP-DO-BACKEND:8000
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // a IA pode demorar vários minutos em computadores sem GPU
          timeout: 300000,
          proxyTimeout: 300000,
        },
      },
    },
  }
})
