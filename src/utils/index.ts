import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { ASSETS_DIR_RE, EXT_RE, ROOT_DIR, SRC_DIR_RE } from '../constants'

/** 替换字符串指定位置的字符 */
export function replaceStringAtPosition(originalStr: string, start: number, end: number, replaceWith: string) {
  return originalStr.substring(0, start) + replaceWith + originalStr.substring(end)
}

/** 转换为斜杠路径 */
export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

/** 规范路径 ｜ 处理路径斜杠 */
export function normalizePath(id: string) {
  return process.platform === 'win32' ? slash(id) : id
}

/** 规范函数语法 */
export function normalizeFunctionSyntax(funcStr: string, anonymous = false): string {
  return funcStr.replace(/^\s*(async\s+)?(function\s+)?([\w$]+)\s*\(/, (match, asyncKeyword, funcKeyword, funcName) => {
    return !anonymous && funcName && !['function', 'async'].includes(funcName)
      ? `${asyncKeyword || ''}function ${funcName}(`
      : `${asyncKeyword || ''}${funcName === 'async' ? padEndStringSpaces(funcName, 1) : 'function'}(`
  })
}

/**
 * 字符串末尾填充空格
 * @param str 待处理字符串
 * @param count 填充数量 ｜ 默认 0
 * @returns 处理后的字符串 ｜ 兜底处理成空字符串
 */
export function padEndStringSpaces(str: string | undefined, count = 0) {
  str = str?.toString()
  return str?.padEnd(str?.length + count) || ''
}

/** 检查并创建目录 */
export function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/** 路径处理器 | 去除`rootDir`前缀路径和查询参数 | `rootDir`默认为项目根目录 */
export function moduleIdProcessor(id: string, rootDir = ROOT_DIR) {
  rootDir = normalizePath(rootDir)
  // 确保 rootDir 以斜杠结尾
  if (!rootDir.endsWith('/'))
    rootDir += '/'

  const normalized = normalizePath(id)
  const name = normalized.split('?')[0]
  // 从name中剔除 rootDir 前缀
  const updatedName = name.replace(rootDir, '')

  // 去除来自`node_modules`模块的前缀
  if (updatedName.startsWith('\x00'))
    return updatedName.slice(1)

  return updatedName
}

/**
 * 计算相对路径的调用层级
 * @param importer 引入者文件的路径
 * @param imported 被引入文件的路径
 * @returns 相对路径前缀
 */
export function calculateRelativePath(importer: string, imported: string): string {
  // 获取相对路径
  const relativePath = path.relative(path.dirname(importer), imported)

  // 将路径中的反斜杠替换为正斜杠（适用于 Windows 系统）
  return relativePath.replace(/\\/g, '/')
}

/** 处理 src 前缀的路径 */
export function resolveSrcPath(id: string) {
  return id.replace(SRC_DIR_RE, './')
}

/** 处理 assets 前缀的路径 */
export function resolveAssetsPath(id: string) {
  return id.replace(ASSETS_DIR_RE, './')
}

/** 判断是否有后缀 */
export function hasExtension(id: string) {
  return EXT_RE.test(id)
}

/** 短横线命名法 */
export function kebabCase(key: string) {
  if (!key)
    return key

  const result = key.replace(/([A-Z])/g, ' $1').trim()
  return result.split(' ').join('-').toLowerCase()
}

/** 查找第一个不连续的数字 */
export function findFirstNonConsecutive(arr: number[]): number | null {
  if (arr.length < 2)
    return null // 如果数组长度小于2，直接返回null

  const result = arr.find((value, index) => index > 0 && value !== arr[index - 1] + 1)
  return result !== undefined ? result : null
}

/** 查找第一个不连续的数字之前的数字 */
export function findFirstNonConsecutiveBefore(arr: number[]): number | null {
  if (arr.length < 2)
    return null // 如果数组长度小于2，直接返回null

  const result = arr.find((value, index) => index > 0 && value !== arr[index - 1] + 1)
  return (result !== undefined && result !== null) ? arr[arr.indexOf(result) - 1] : null
}

export * from './getTsConfigPaths'
export * from './lex-parse'
