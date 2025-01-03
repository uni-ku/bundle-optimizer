import type { PluginOption } from 'vite'
import type { IOptions } from './type.d'
import AsyncComponent from './async-component'
import AsyncImport from './async-import'
import { ParseOptions } from './common/ParseOptions'
import UniappSubPackagesOptimization from './main'
import { initializeVitePathResolver } from './utils'

export default (options: IOptions = {}): PluginOption => {
  const parse = new ParseOptions(options)

  return [
    {
      name: 'optimization:initialized',
      config(config) {
        initializeVitePathResolver(config)
      },
    },
    // 分包优化
    parse.enable.optimization && UniappSubPackagesOptimization(parse.logger.optimization),
    // js/ts插件的异步调用
    parse.enable['async-import'] && AsyncImport(parse.dts['async-import'], parse.logger['async-import']),
    // vue组件的异步调用
    parse.enable['async-component'] && AsyncComponent(parse.dts['async-component'], parse.logger['async-component']),
  ]
}

export * from './type.d'
