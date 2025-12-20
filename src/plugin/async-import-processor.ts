/* eslint-disable unused-imports/no-unused-vars */
import type { Plugin } from 'vite'
import process from 'node:process'
import { logger } from '../common/Logger'

/**
 * ### 异步引用语法多端支持
 * @description 让多端支持 esm 异步引用语法 `import()`
 * @platform h5 -> import()
 * @platform mp -> require.async()
 * @todo 暂时不支持app端：首先由于app端使用的是iife模式，代码内容中无法使用`import()`语法，直接会编译报错
 */
export function AsyncImportProcessor(enableLogger: boolean): Plugin {
  const platform = process.env.UNI_PLATFORM
  /** 是否小程序 */
  const isMP = platform?.startsWith('mp')
  /** 是否H5 */
  const isH5 = platform === 'h5'
  /** 是否为app */
  const isApp = platform === 'app'

  logger.info('[async-import] 异步导入处理器已启用', !enableLogger)

  return {
    name: 'async-import-processor',
    enforce: 'post', // 插件执行时机，在其他处理后执行
    renderDynamicImport(options) {
      if (!isMP)
        return

      return {
        left: 'require.async(',
        right: ')',
      }
    },
  }
}

export default AsyncImportProcessor
