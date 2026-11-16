import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, send /api calls to the Spring Boot app on port 8080.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
