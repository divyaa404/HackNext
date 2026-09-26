import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: {
      usePolling: true
    },
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.IS_DOCKER === 'true' ? 'http://backend:4000' : 'http://127.0.0.1:4000',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.IS_DOCKER === 'true' ? 'http://backend:4000' : 'http://127.0.0.1:4000',
        changeOrigin: true
      }
    }
  }
})
