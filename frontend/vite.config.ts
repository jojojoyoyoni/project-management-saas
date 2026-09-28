import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <--- ADD THIS IMPORT

export default defineConfig({
  plugins: [react()],
  
  // ADD THIS BLOCK to fix the @ alias!
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
        changeOrigin: true,
      }
    },
  },
})