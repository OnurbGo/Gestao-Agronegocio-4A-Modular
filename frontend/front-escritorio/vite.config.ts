import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const basePath = process.env.VITE_BASE_PATH?.startsWith('/')
  ? process.env.VITE_BASE_PATH
  : '/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: basePath,
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost',
    },
  },
})
