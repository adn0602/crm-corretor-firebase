import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumentamos o limite para o aviso não aparecer mais
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Isso organiza as bibliotecas pesadas (como o Firebase) em um arquivo separado
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
