import type { Alias, UserConfig } from 'vite'
import path from 'node:path'
import { isRegExp } from 'node:util/types'
import { normalizePath } from '.'

/**
/**
 * 创建一个基于 vite 配置的路径解析函数
 * @param config vite 配置
 * @returns 路径解析函数
 */
export function createVitePathResolver(config: UserConfig) {
  const tempAlias = config.resolve?.alias ?? []
  let alias: Alias[] = []
  if (!Array.isArray(tempAlias)) {
    alias = Object.entries(tempAlias as { [find: string]: string }).map(([find, replacement]) => ({ find, replacement }))
  }
  else {
    alias = tempAlias
  }

  return (source: string, relative = false) => {
    for (let { find, replacement, customResolver: _customResolver } of alias) {
      if (!find || !replacement)
        continue

      source = normalizePath(source)
      if (typeof replacement === 'string' && !isRegExp(replacement) && !replacement.includes('*')) {
        replacement = normalizePath(replacement)
      }

      if (!isRegExp(replacement) && typeof replacement === 'string' && !replacement.includes('*')
        && !isRegExp(find) && typeof find === 'string' && !find.includes('*')) {
        if (source === find) {
          // 断定为全量匹配
          return relative ? replacement : path.resolve(replacement)
        }
        else if (source.startsWith(find)) {
          // 断定为前缀匹配
          const realPath = source.replace(find, replacement)
          return relative ? realPath : path.resolve(realPath)
        }
      }
      else if (source.match(find) && (isRegExp(find) || !find.includes('*'))) {
        const realPath = source.replace(find, replacement)
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
