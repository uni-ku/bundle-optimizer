import process from 'node:process'
import { diffStrings } from './utils'

/**
 * `js`|`jsx`|`ts`|`uts`|`tsx`|`mjs`|`json`
 * @description json 文件会被处理成 js 模块
 */
export const EXTNAME_JS_RE = /\.(js|jsx|ts|uts|tsx|mjs|json)$/
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

/**
 * Uniapp 业务源码入口
 */
export const UNI_INPUT_DIR = process.env.UNI_INPUT_DIR!
if (!UNI_INPUT_DIR) {
  throw new Error('`UNI_INPUT_DIR` is not defined')
}

// UNI_INPUT_DIR 必须包含于 ROOT_DIR
if (!(`${UNI_INPUT_DIR}/`).startsWith(ROOT_DIR)) {
  throw new Error('`UNI_INPUT_DIR` need startsWith `ROOT_DIR`')
}

/**
 * Uniapp 输出目录
 */
export const UNI_OUTPUT_DIR = process.env.UNI_OUTPUT_DIR!
if (!UNI_OUTPUT_DIR) {
  throw new Error('`UNI_OUTPUT_DIR` is not defined')
}

const pathDiff = diffStrings(ROOT_DIR, UNI_INPUT_DIR)
/**
 * uniapp 业务源码路径与项目根路径的差异
 */
export const UNI_SRC_DIFF_PATH = !pathDiff.diffA && !pathDiff.suffix && pathDiff.prefix === ROOT_DIR ? pathDiff.diffB : ''
