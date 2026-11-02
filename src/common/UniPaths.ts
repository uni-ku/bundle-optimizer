import path from 'node:path'
import process from 'node:process'
import { slash } from '../utils/path'

export interface UniPaths {
  /** 项目根目录，来自 `VITE_ROOT_DIR` */
  rootDir: string
  /** uni-app 业务源码目录，必须位于项目根目录内 */
  inputDir: string
  /** uni-app 构建产物目录 */
  outputDir: string
  /** 源码目录相对项目根目录的路径，两个目录相同时为空字符串 */
  srcDiffPath: string
}

/** 原始环境变量组合，用于识别同一次构建内的重复路径解析 */
let cacheKey: string | undefined
let cachedPaths: UniPaths | undefined

function normalizeDirectory(directory: string) {
  return slash(path.resolve(directory))
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[bundle-optimizer] \`${name}\` is not defined`)
  }
  return value
}

/** 判断目录是否等于根目录或位于根目录内，避免兄弟目录的前缀误判 */
function isInsideDirectory(rootDir: string, directory: string) {
  const relativePath = path.relative(rootDir, directory)
  return relativePath === ''
    || (!path.isAbsolute(relativePath) && !relativePath.startsWith(`..${path.sep}`))
}

/**
 * 获取当前 uni-app 构建路径
 *
 * @description 路径会解析为绝对路径并统一 `/` 分隔符；环境变量变化后会重新解析
 * @throws 路径环境变量缺失，或 `UNI_INPUT_DIR` 位于 `VITE_ROOT_DIR` 外
 */
export function getUniPaths(): UniPaths {
  const rawRootDir = process.env.VITE_ROOT_DIR
  const rawInputDir = process.env.UNI_INPUT_DIR
  const rawOutputDir = process.env.UNI_OUTPUT_DIR
  const nextCacheKey = `${rawRootDir ?? ''}\0${rawInputDir ?? ''}\0${rawOutputDir ?? ''}`

  if (cachedPaths && nextCacheKey === cacheKey) {
    return cachedPaths
  }

  const rootDir = normalizeDirectory(requireEnv('VITE_ROOT_DIR'))
  const inputDir = normalizeDirectory(requireEnv('UNI_INPUT_DIR'))
  const outputDir = normalizeDirectory(requireEnv('UNI_OUTPUT_DIR'))

  if (!isInsideDirectory(rootDir, inputDir)) {
    throw new Error('[bundle-optimizer] `UNI_INPUT_DIR` must be inside `VITE_ROOT_DIR`')
  }

  const srcDiffPath = slash(path.relative(rootDir, inputDir))
  cachedPaths = { rootDir, inputDir, outputDir, srcDiffPath }
  cacheKey = nextCacheKey
  return cachedPaths
}
