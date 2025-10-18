import type { Alias, UserConfig } from 'vite'
import path from 'node:path'
import { isRegExp } from 'node:util/types'
import { normalizePath } from '..'

/**
 * @link https://github.com/rollup/plugins/blob/c3dcdc0d2eda4db74bdc772bc369f3f9325802bf/packages/alias/src/index.ts#L7
 */
function matches(pattern: string | RegExp, source: string) {
  if (pattern instanceof RegExp) {
    return pattern.test(source)
  }
  if (source.length < pattern.length) {
    return false
  }
  if (source === pattern) {
    return true
  }
  return source.startsWith(pattern.endsWith('/') ? pattern : (`${pattern}/`))
}

/**
/**
 * 创建一个基于 vite 配置的路径解析函数
 * @param config vite 配置
 * @returns 路径解析函数
 */
export function createVitePathResolver(config: UserConfig) {
  const normalize = (str: any) => {
    if (typeof str === 'string' && !isRegExp(str) && !str.includes('*')) {
      str = normalizePath(str)
    }
    return str
  }

  const tempAlias = config.resolve?.alias ?? []
  let alias: Alias[] = []
  if (!Array.isArray(tempAlias)) {
    alias = Object.entries(tempAlias as { [find: string]: string }).map(([find, replacement]) => ({ find, replacement }))
  }
  else {
    alias = tempAlias
  }

  return (source: string, relative = false) => {
    const matchedEntry = alias.find(entry => matches(entry.find, source))
    if (!matchedEntry) {
      return source
    }
    const normalizeReplacement = normalize(matchedEntry.replacement)

    if (isRegExp(matchedEntry.find)) {
      const realPath = source.replace(matchedEntry.find, normalizeReplacement)
      return relative ? realPath : path.resolve(realPath)
    }

    // 避开 glob 特征的字符串
    if (!matchedEntry.find.includes('*') && !normalizeReplacement.includes('*')) {
      // 断定为全量匹配
      if (source === matchedEntry.find) {
        return relative ? normalizeReplacement : path.resolve(normalizeReplacement)
      }
      // 断定为前缀匹配
      if (source.startsWith(matchedEntry.find)) {
        const subPath = source.substring(matchedEntry.find.length) // 获取去除前缀的子串
        const realPath = path.join(normalizeReplacement, subPath) // join 自动处理路径拼接问题
        return relative ? realPath : path.resolve(realPath)
      }
    }
    return source
  }
}

/** vite插件相关的路径解析 | 单例模式 */
let vitePathResolver: ((source: string, relative?: boolean) => string) | null = null

export function getVitePathResolver() {
  if (!vitePathResolver) {
    throw new Error('Vite path resolver has not been initialized. Please call createVitePathResolver first.')
  }
  return vitePathResolver
}

export function initializeVitePathResolver(config: UserConfig) {
  vitePathResolver = createVitePathResolver(config)
}
