import { fileURLToPath, URL } from 'node:url'
import Uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Uni(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
