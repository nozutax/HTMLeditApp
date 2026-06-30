import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: https://nozutax.github.io/HTMLeditApp/
export default defineConfig({
  base: '/HTMLeditApp/',
  plugins: [react(), tailwindcss()],
})
