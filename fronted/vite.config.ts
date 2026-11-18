import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

/*
 * No separar React/React DOM en chunks manuales.
 * Con pdfjs-dist y el chunk genérico se generaba una dependencia circular
 * entre vendor-react y vendor que rompía la inicialización de React en
 * producción ("Cannot set properties of undefined (setting 'Activity')").
 * Las rutas siguen dividiéndose mediante imports lazy.
 */
export default defineConfig({
  plugins: [react()],
})
