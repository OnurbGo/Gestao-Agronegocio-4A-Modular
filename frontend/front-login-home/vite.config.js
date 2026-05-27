/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const basePath = process.env.VITE_BASE_PATH?.startsWith('/')
  ? process.env.VITE_BASE_PATH
  : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: basePath,
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost',
    },
  },
})
