import type { IOptimizationOptions } from './type'
import AsyncComponent from './async-component'
import AsyncImport from './async-import'
import UniappSubPackagesOptimization from './main'

export default (options: IOptimizationOptions) => {
  return [
    // 分包优化
    UniappSubPackagesOptimization(),
    // js/ts插件的异步调用
    AsyncImport(options),
    // vue组件的异步调用
    AsyncComponent(),
  ]
}

export * from './type.d'
