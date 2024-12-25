import type { PluginOption } from 'vite'
import type { IOptions } from './type.d'
import AsyncComponent from './async-component'
import AsyncImport from './async-import'
import { ParseOptions } from './common/ParseOptions'
import UniappSubPackagesOptimization from './main'

export default (options: IOptions = {}): PluginOption => {
  const parse = new ParseOptions(options)

  return [
    // 分包优化
    parse.enable.optimization && UniappSubPackagesOptimization(),
    // js/ts插件的异步调用
    parse.enable['async-import'] && AsyncImport(parse.dts['async-import']),
    // vue组件的异步调用
    parse.enable['async-component'] && AsyncComponent(parse.dts['async-component']),
  ]
}

export * from './type.d'
