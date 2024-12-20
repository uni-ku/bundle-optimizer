import { fileURLToPath, URL } from 'node:url'
import Uni from '@dcloudio/vite-plugin-uni'
import Optimization from '@uni-ku/bundle-optimizer'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      Uni(),
      Optimization({ command, mode }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
