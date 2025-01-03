import Uni from '@dcloudio/vite-plugin-uni'
import Optimization from '@uni-ku/bundle-optimizer'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Uni(),
    // 可以无需传递任何参数，默认开启所有插件功能，并在项目根目录生成类型定义文件
    Optimization({
      // 插件功能开关，默认为true，即开启所有功能
      enable: {
        'optimization': true,
        'async-import': true,
        'async-component': true,
      },
      // dts文件输出配置，默认为true，即在项目根目录生成类型定义文件
      dts: {
        'enable': true,
        'base': './types',
      },
      // 也可以传递具体的子插件的字符串列表，如 ['optimization', 'async-import', 'async-component']，开启部分插件的log功能
      logger: true,
    }),
  ],
  resolve: {
    alias: {
      '#/*': '/src',
    }
  }
})