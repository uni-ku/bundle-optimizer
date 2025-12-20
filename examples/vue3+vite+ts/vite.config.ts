import { fileURLToPath, URL } from 'node:url'
import Uni from '@dcloudio/vite-plugin-uni'
import Optimization from '@uni-ku/bundle-optimizer'
import UniComponents, { kebabCase } from '@uni-helper/vite-plugin-uni-components'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  return {
    base: './',
    plugins: [
      // 可以无需传递任何参数，默认开启所有插件功能，并在项目根目录生成类型定义文件
      Optimization({
        // 插件功能开关，默认为true，即开启所有功能
        enable: {
          'optimization': true,
          'async-import': true,
          'async-component': true,
        },
        logger: false,
        logToFile: true,
      }),
      UniComponents({
        dts: 'src/types/components.d.ts',
        directoryAsNamespace: true,
        resolvers: [
          {
            type: 'component',
            resolve: (name: string) => {
              if (name.match(/^Biz[A-Z]/)) {
                const compName = kebabCase(name)
                
                return {
                  name,
                  from: `biz-components/components/${compName}/${compName}.vue`,
                }
              }
            },
          },
        ],
      }),
      Uni(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
