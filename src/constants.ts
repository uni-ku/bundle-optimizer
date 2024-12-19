import process from 'node:process'

export const EXTNAME_JS_RE = /\.(js|jsx|ts|uts|tsx|mjs)$/
export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/

export const knownJsSrcRE
  = /\.(?:[jt]sx?|m[jt]s|vue|marko|svelte|astro|imba|mdx)(?:$|\?)/

export const CSS_LANGS_RE
  = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/

/** `assets` 或者 `./assets` 开头的文件夹 */
export const ASSETS_DIR_RE = /^(\.?\/)?assets\//

/** `src` 或者 `./src` 开头的文件夹 */
export const SRC_DIR_RE = /^(\.?\/)?src\//

/** 文件后缀 */
export const EXT_RE = /\.\w+$/

export function isCSSRequest(request: string): boolean {
  return CSS_LANGS_RE.test(request)
}

/**
 * 项目根路径
 *
 * // TODO: 后续自实现项目根路径的查找
 */
export const ROOT_DIR = process.env.VITE_ROOT_DIR!
if (!ROOT_DIR) {
  throw new Error('`ROOT_DIR` is not defined')
}
