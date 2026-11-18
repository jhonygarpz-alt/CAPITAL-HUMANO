import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa: permite publicar la carpeta dist/ en cualquier hosting estático
export default defineConfig({
  base: './',
  plugins: [react()],
})
