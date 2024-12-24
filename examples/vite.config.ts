import { fileURLToPath, URL } from 'node:url'
import Uni from '@dcloudio/vite-plugin-uni'
import Optimization from '@uni-ku/bundle-optimizer'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    Uni(),
    Optimization({
      dts: {
        asyncImport: 'src/types/async-import.d.ts',
        asyncComponent: 'src/types/async-component.d.ts',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
