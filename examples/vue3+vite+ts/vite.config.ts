import { fileURLToPath, URL } from 'node:url'
import Uni from '@dcloudio/vite-plugin-uni'
import Optimization from '@uni-ku/bundle-optimizer'
import UniComponents, { kebabCase } from '@uni-helper/vite-plugin-uni-components'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    // 可以无需传递任何参数，默认开启所有插件功能，并在项目根目录生成类型定义文件
    Optimization({
      enable: {
        'optimization': true,
        'async-import': true,
        'async-component': true,
      },
      dts: {
        'enable': true,
        'base': 'src/types',
        // 上面是对类型生成的比较全局的一个配置
        // 下面是对每个类型生成的配置，以下各配置均为可选参数
        'async-import': {
          enable: true,
          base: 'src/types',
          name: 'async-import.d.ts',
          path: 'src/types/async-import.d.ts',
        },
        'async-component': {
          enable: true,
          base: 'src/types',
          name: 'async-component.d.ts',
          path: 'src/types/async-component.d.ts',
        },
      },
      logger: true,
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
})
