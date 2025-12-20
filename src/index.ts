import type { PluginOption } from 'vite'
import type { IOptions } from './type'
import fs from 'node:fs'
import { name } from '../package.json'
import { logger } from './common/Logger'
import { ParseOptions } from './common/ParseOptions'
import AsyncComponentProcessor from './plugin/async-component-processor'
import AsyncImportProcessor from './plugin/async-import-processor'
import SubPackagesOptimization from './plugin/subpackages-optimization'
import { ensureDirectoryExists, initializeVitePathResolver } from './utils'

export default (options: IOptions = {}): PluginOption => {
  const parse = new ParseOptions(options)

  let logToFile = options.logToFile
  if (logToFile) {
    logToFile = typeof logToFile === 'string' ? logToFile : `node_modules/.cache/${name}/logs.log`
    if (typeof logToFile !== 'string') {
      logger.warn('logToFile should be a string, using default path: node_modules/.cache/bundle-optimizer/logs.log')
      logToFile = `node_modules/.cache/${name}/logs.log`
    }
    ensureDirectoryExists(logToFile)
    // 删除旧的日志文件
    try {
      fs.unlinkSync(logToFile)
    }
    catch (error) {
      logger.error(`Failed to delete old log file: ${error}`)
    }

    logger.onLog = (context, level, message, timestamp) => {
      const line = `${context} ${level} [${timestamp}]: ${message}`
      fs.writeFileSync(logToFile as string, `${line}\n`, { flag: 'a' })
    }
  }

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
    parse.enable['async-import'] && AsyncImportProcessor(parse.logger['async-import']),
    // vue组件的异步调用
    // 处理 `.vue?async` 查询参数的静态导入
    parse.enable['async-component'] && AsyncComponentProcessor(parse.dts['async-component'], parse.logger['async-component']),
  ]
}

export type * from './type'
