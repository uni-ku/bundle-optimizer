import type { OutputChunk } from '../../type'
import path from 'node:path'
import { UNI_OUTPUT_DIR } from '../../constants'
import base64url from '../base64url'
import { getUniappOutputPath } from './common'

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

export function parseVirtualPath<T extends string>(virtualUrl?: T | null): ParseResult {
  if (virtualUrl?.startsWith(uniPagePrefix)) {
    return [true, parseVirtualPagePath(virtualUrl), 'page']
  }
  if (virtualUrl?.startsWith(uniComponentPrefix)) {
    return [true, parseVirtualComponentPath(virtualUrl), 'component']
  }
  return [false, virtualUrl ?? '', null]
}

export function checkUniComponentByChunk(chunk?: OutputChunk) {
  if (!chunk || chunk.type !== 'chunk' || !chunk.facadeModuleId) {
    return
  }
  // 如果是虚拟组件这里将会符合虚拟组件的特征
  const facadeModuleId = chunk.facadeModuleId
  const [is, maybePage, type] = parseVirtualPath(facadeModuleId)
  if (!is || !path.isAbsolute(maybePage)) {
    return
  }
  // 获得拟输出路径，无后缀
  const outputPath = getUniappOutputPath(maybePage)

  // 构建产物相对于构建根目录的文件路径名称
  const fileName = chunk.fileName
  const { name, dir, ext } = path.parse(fileName)
  const todo = path.join(UNI_OUTPUT_DIR, dir, name)
  if (todo !== outputPath) {
    return
  }
  // 进一步判断是否是虚拟组件，虚拟组件
  const moduleIds = chunk.moduleIds
  if (moduleIds.includes(facadeModuleId) && moduleIds.some(item => (item.split('?')[0] === maybePage))) {
    return { type, output: [todo, ext].filter(Boolean).join('.'), input: maybePage }
  }
}
