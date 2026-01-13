/* eslint-disable unused-imports/no-unused-vars */
import type { Plugin } from 'vite'
import process from 'node:process'
import { MagicString } from '@vue/compiler-sfc'
import { babelParse } from 'ast-kit'
import { logger } from '../common/Logger'
import {
  getDynamicImports,
  isUniVirtualPath,
  parseVirtualPath,
} from '../utils'

/**
 * ### 异步引用语法多端支持
 * @description 让多端支持 esm 异步引用语法 `import()`
 * @platform h5 -> import()
 * @platform mp -> require.async()
 * @platform app -> app端的编译格式是iife，无法使用`import()`语法，本插件将全量屏蔽`import()`行为
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

  const resolvedByWhitelist = {
    /**
     * app 端部分来源的动态引用是允许的
     */
    app: ['uni:app-nvue-app-style'],
  }

  return {
    name: 'async-import-processor',
    enforce: 'post', // 插件执行时机，在其他处理后执行
    async transform(code, id, options) {
      if (!code.includes('import(') || (!isMP && !isApp))
        return

      const platform = isMP ? '小程序' : 'APP'

      try {
        const ast = babelParse(code, 'js', {
          plugins: [['importAttributes', { deprecatedAssertSyntax: true }]],
          cache: true,
        })
        const dynamicImports = getDynamicImports(ast)
          .filter(i => typeof i.path === 'string' && !isUniVirtualPath(i.path))

        // 初始化 MagicString
        const s = new MagicString(code)
        let hasChanged = false

        // TODO: 小程序端，将业务中所有对组件文件的异步引用都屏蔽，虚拟路径除外
        // TODO: app端，将业务中所有的异步引用都屏蔽，虚拟路径除外
        for (const dynamicImport of dynamicImports) {
          if (typeof dynamicImport.path !== 'string' || !dynamicImport.node.start || !dynamicImport.node.end) {
            continue
          }
          const resolved = await this.resolve(dynamicImport.path, id)
          if (!resolved) {
            continue
          }
          if (isApp ? resolvedByWhitelist.app.includes(resolved.resolvedBy) : !resolved.id.endsWith('.vue')) {
            continue
          }
          const { start, end } = dynamicImport.node
          // 将 import(...) 替换为无副作用的占位符
          // 替换为 Promise 占位符，防止业务代码 await 报错
          s.overwrite(start, end, 'Promise.resolve({})')
          hasChanged = true
          logger.warn(`[async-import] 检测到 ${platform} 环境中存在非法的动态 import() 将禁止：${dynamicImport.path}`, false)
        }
        if (hasChanged) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          }
        }
      }
      catch (e) { /** ignore */ }
    },
    renderDynamicImport(options) {
      const targetModuleId = options.targetModuleId
      if (!isMP || !targetModuleId)
        return

      // 避免对 uni 虚拟组件异步引用的干预
      if (isUniVirtualPath(targetModuleId))
        return

      const moduleInfo = this.getModuleInfo(targetModuleId)
      for (const importer of moduleInfo?.importers ?? []) {
        const [is, maybePath, type] = parseVirtualPath(importer)
        // 这里说明业务中存在对一个 vue 组件的异步 import 的行为
        // ! 这是不允许的，此处略过，不干预
        if (is && targetModuleId === maybePath) {
          return
        }
      }

      return {
        left: 'require.async(',
        right: ')',
      }
    },
  }
}

export default AsyncImportProcessor
