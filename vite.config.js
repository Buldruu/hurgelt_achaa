import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/hurgelt_achaa/',  // GitHub repo нэртэй таарах ёстой
})
