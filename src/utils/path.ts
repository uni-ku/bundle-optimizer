import process from 'node:process'

/** 将路径分隔符统一为 `/` */
export function slash(value: string): string {
  return value.replace(/\\/g, '/')
}

/** 规范路径分隔符 */
export function normalizePath(value: string): string {
  return process.platform === 'win32' ? slash(value) : value
}
