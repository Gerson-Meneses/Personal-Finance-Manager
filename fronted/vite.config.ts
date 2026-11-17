import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

/**
 * Separa librerías pesadas en chunks propios para mejorar el cacheado entre
 * despliegues. El catálogo de iconos ya está curado en `iconRegistry`, así que
 * este chunk solo contiene los iconos realmente usados.
 */
function manualChunks(id: string) {
  if (!id.includes('node_modules')) return

  if (
    id.includes('recharts') ||
    id.includes('d3-') ||
    id.includes('victory-vendor') ||
    id.includes('react-smooth')
  ) {
    return 'vendor-charts'
  }

  if (id.includes('lucide-react')) return 'vendor-icons'
  if (id.includes('@tanstack')) return 'vendor-query'
  if (id.includes('react-router')) return 'vendor-router'

  if (
    id.includes('scheduler') ||
    id.includes('react-dom') ||
    id.includes('/react/')
  ) {
    return 'vendor-react'
  }

  if (id.includes('dayjs') || id.includes('date-fns')) return 'vendor-dates'

  if (
    id.includes('zod') ||
    id.includes('react-hook-form') ||
    id.includes('@hookform')
  ) {
    return 'vendor-forms'
  }

  return 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
})
