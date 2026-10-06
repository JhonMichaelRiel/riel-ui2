import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/crud/',
  build: {
    outDir: '../backend/public/crud',
    emptyOutDir: true,
  },
})
