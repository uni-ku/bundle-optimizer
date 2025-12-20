import type { Plugin } from 'vite'
import fs from 'node:fs'
import process from 'node:process'
import { logger } from '../common/Logger'
import {
  COMPONENT_PLACEHOLDER,
  DEFINE_OPTIONS,
  filterMacro,
  getComponentPlaceholder,
  getDefaultExports,
  getUniappOutputPath,
  kebabCase,
  parseSFC,
} from '../utils'

/**
 * ### 小程序端跨包组件异步引用支持
 * 扫描 vue 组件的 defineOptions 或者默导出的 `componentPlaceholder` 关键词配置
 * @description 将会在组件/页面的 json 文件中注入 `componentPlaceholder` 配置
 * @see https://github.com/uni-ku/bundle-optimizer/issues/26#issuecomment-3611984928
 */
export function AsyncComponentProcessor(enableLogger: boolean): Plugin {
  const platform = process.env.UNI_PLATFORM
  const isMP = platform?.startsWith('mp-')

  const asyncComponents = new Map<string, Record<string, unknown>>()
  logger.info('[async-component] 异步组件处理器已启用', !enableLogger)

  return {
    name: 'async-component-processor',
    enforce: 'post', // 插件执行时机，在其他处理后执行
    async transform(source, id) {
      if (!isMP || !id.endsWith('.vue') || !source.includes(COMPONENT_PLACEHOLDER)) {
        return
      }
      const sfc = parseSFC(source, id)
      if (!sfc.scriptSetup && !sfc.script)
        return

      const { getSetupAst, getScriptAst } = sfc

      const collectPlaceholder = (node?: any) => {
        let obj: Record<string, unknown> | undefined
        // eslint-disable-next-line no-cond-assign
        if (node?.type === 'ObjectExpression' && (obj = getComponentPlaceholder(node))) {
          const res: any = {}
          Object.entries(obj).forEach(([key, val]) => {
            // todo: 小程序端需要 kebab-case 风格的组件名称
            res[kebabCase(key.toString())] = kebabCase((val ?? 'view').toString())
          })
          asyncComponents.set(getUniappOutputPath(id), res)
        }
      }

      const setupAst = getSetupAst()
      const scriptAst = getScriptAst()
      // 这里是在检测 vue 文件是否有默认导出的 script 域，旨在这种写法不和 defineOptions 写法共存
      // 详见 unplugin-vue-define-options 的实现
      // 这里不做这么严格的检测，而是做合并配置，defineOptions 下的配置优先级更高
      // if (setupAst && scriptAst)
      //   checkDefaultExport(scriptAst.body)

      if (scriptAst) {
        const [defaultExport] = getDefaultExports(scriptAst)
        collectPlaceholder(defaultExport?.declaration)
      }
      if (setupAst) {
        const macroNodes = filterMacro(setupAst.body)
        if (macroNodes.length > 1) {
          throw new SyntaxError(`duplicate ${DEFINE_OPTIONS}() call`)
        }
        collectPlaceholder(macroNodes?.[0]?.arguments?.[0])
      }
    },
    // 直接修改
    closeBundle() {
      if (asyncComponents.size === 0)
        return

      for (const [outputPath, config] of asyncComponents) {
        if (!fs.existsSync(outputPath)) {
          continue
        }
        const content = fs.readFileSync(outputPath, 'utf-8')
        const json = JSON.parse(content)
        json.componentPlaceholder = config
        fs.writeFileSync(outputPath, JSON.stringify(json, null, 2))
      }
    },
  }
}

export default AsyncComponentProcessor
