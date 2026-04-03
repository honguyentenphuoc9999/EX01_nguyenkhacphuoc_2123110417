import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
        // Nếu cần proxy sang Backend
        '/api': {
            target: 'https://localhost:7170',
            changeOrigin: true,
            secure: false
        }
    }
  }
})
