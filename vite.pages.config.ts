import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/agenda-clinica-fullstack/',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true'),
  },
  build: {
    outDir: 'dist-pages',
  },
})
