import type { ModuleInfo } from '../../type'
import path from 'node:path'
import process from 'node:process'
import { moduleIdProcessor, parseQuerystring } from '..'
import { ROOT_DIR } from '../../constants'
import base64url from '../base64url'

export const uniPagePrefix = 'uniPage://' as const
export const uniComponentPrefix = 'uniComponent://' as const

export function virtualPagePath(filepath: string): `${typeof uniPagePrefix}${string}` {
  return `${uniPagePrefix}${base64url.encode(filepath)}`
}

export function virtualComponentPath(filepath: string): `${typeof uniComponentPrefix}${string}` {
  return `${uniComponentPrefix}${base64url.encode(filepath)}`
}

export function parseVirtualPagePath(uniPageUrl: string) {
  return base64url.decode(uniPageUrl.replace(uniPagePrefix, ''))
}

export function parseVirtualComponentPath(uniComponentUrl: string) {
  return base64url.decode(uniComponentUrl.replace(uniComponentPrefix, ''))
}

export function isUniVirtualPagePath(path: string): path is `${typeof uniPagePrefix}${string}` {
  return path.startsWith(uniPagePrefix)
}

export function isUniVirtualComponentPath(path: string): path is `${typeof uniComponentPrefix}${string}` {
  return path.startsWith(uniComponentPrefix)
}

export function isUniVirtualPath(path: string): path is `${typeof uniPagePrefix}${string}` | `${typeof uniComponentPrefix}${string}` {
  return isUniVirtualPagePath(path) || isUniVirtualComponentPath(path)
}

// Old: [boolean, string, 'page' | 'component' | null]
type ParseResult
  = | [true, string, 'page' | 'component']
    | [false, string, null]

export function parseVirtualPath<T extends string>(virtualUrl?: T): ParseResult {
  if (virtualUrl?.startsWith(uniPagePrefix)) {
    return [true, parseVirtualPagePath(virtualUrl), 'page']
  }
  if (virtualUrl?.startsWith(uniComponentPrefix)) {
    return [true, parseVirtualComponentPath(virtualUrl), 'component']
  }
  return [false, virtualUrl ?? '', null]
}

/**
 * 获取 uniapp 输出目录
 * @param filePath 源码绝对路径
 * @link https://github.com/chouchouji/vite-plugin-component-placeholder/blob/4509023c4ee07c2219ec62b106de013dbd3f2a9d/src/index.ts#L8
 */
export function getUniappOutputPath(filePath: string) {
  const relativePath = path.relative(process.env.UNI_INPUT_DIR!, filePath)
  const { name, dir } = path.parse(relativePath)

  return path.join(process.env.UNI_OUTPUT_DIR!, dir, name)
}

/**
 * 创建一个 vue 文件的 script 函数模块解析函数
 * @example 类似于 `xxx.vue?vue&type=script&setup=true&lang.ts` 的路径
 */
export function createVueScriptAnalysis(inputDir = ROOT_DIR) {
  /**
   * # id处理器
   * @description 将id中的moduleId转换为相对于inputDir的路径并去除查询参数后缀
   */
  function _moduleIdProcessor(id: string, removeQuery = true) {
    return moduleIdProcessor(id, inputDir, removeQuery)
  }

  /**
   * 判断模块是否是一个 vue 文件的 script 函数模块
   * @example 类似于 `xxx.vue?vue&type=script&setup=true&lang.ts` 的路径
   */
  return function isVueScript(moduleInfo?: Partial<ModuleInfo> | null): moduleInfo is Partial<ModuleInfo> {
    if (!moduleInfo?.id || !('importers' in moduleInfo) || !moduleInfo?.importers?.length) {
      return false
    }
    const importer = _moduleIdProcessor(moduleInfo.importers[0])
    const id = moduleInfo.id
    const clearId = _moduleIdProcessor(id, false)

    const parsedUrl = parseQuerystring(clearId)

    return !!parsedUrl && parsedUrl.type === 'script' && parsedUrl.vue === true && importer === _moduleIdProcessor(id)
  }
}
