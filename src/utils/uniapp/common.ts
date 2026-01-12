import type { ModuleInfo } from '../../type'
import path from 'node:path'
import { moduleIdProcessor, parseQuerystring } from '..'
import { ROOT_DIR, UNI_INPUT_DIR, UNI_OUTPUT_DIR, UNI_SRC_DIFF_PATH } from '../../constants'

/**
 * 获取 uniapp 输出目录
 * @param filePath 源码绝对路径
 * @link https://github.com/chouchouji/vite-plugin-component-placeholder/blob/4509023c4ee07c2219ec62b106de013dbd3f2a9d/src/index.ts#L8
 */
export function getUniappOutputPath(filePath: string) {
  const relativeByRoot = path.relative(ROOT_DIR, filePath)
  if (relativeByRoot.match(/^(\.?\/)?node_modules\//)) {
    const temp = path.join(UNI_SRC_DIFF_PATH, 'node-modules/')
    filePath = path.join(ROOT_DIR, relativeByRoot.replace(/^(\.?\/)?node_modules\//, temp))
  }
  const relativePath = path.relative(UNI_INPUT_DIR, filePath)
  const { name, dir } = path.parse(relativePath)

  return path.join(UNI_OUTPUT_DIR, dir, name)
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
