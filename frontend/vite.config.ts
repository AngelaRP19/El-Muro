import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy calls to microservices during development
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/posts': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/topics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/carreras': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/subjects': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
    },
  },
})
