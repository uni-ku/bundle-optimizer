import type { PluginOption } from 'vite'
import type { IOptions } from './type'
import { ParseOptions } from './common/ParseOptions'
import AsyncComponentProcessor from './plugin/async-component-processor'
import AsyncImportProcessor from './plugin/async-import-processor'
import SubPackagesOptimization from './plugin/subpackages-optimization'
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
    parse.enable.optimization && SubPackagesOptimization(parse.logger.optimization),
    // js/ts插件的异步调用
    // 处理 `AsyncImport` 函数调用的路径传参
    parse.enable['async-import'] && AsyncImportProcessor(parse.dts['async-import'], parse.logger['async-import']),
    // vue组件的异步调用
    // 处理 `.vue?async` 查询参数的静态导入
    parse.enable['async-component'] && AsyncComponentProcessor(parse.dts['async-component'], parse.logger['async-component']),
  ]
}

export type * from './type'
