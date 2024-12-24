import type { PluginOption } from 'vite'
import type { IPluginOptions } from './type.d'
import AsyncComponent from './async-component'
import AsyncImport from './async-import'
import UniappSubPackagesOptimization from './main'

export default (options: IPluginOptions = {}): PluginOption => {
  return [
    // 分包优化
    UniappSubPackagesOptimization(),
    // js/ts插件的异步调用
    AsyncImport({
      dts: options.dts?.asyncImport,
    }),
    // vue组件的异步调用
    AsyncComponent({
      dts: options.dts?.asyncComponent,
    }),
  ]
}

export * from './type.d'
