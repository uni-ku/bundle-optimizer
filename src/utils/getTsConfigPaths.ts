import path from 'node:path'
import ts from 'typescript'

/**
 * 读取并解析 tsconfig 文件，获取 paths 配置
 * @param tsConfigPath tsconfig.json 文件路径
 * @returns paths 配置对象
 */
function getTsConfigPaths(tsConfigPath: string): Record<string, string[]> {
  const tsConfig = ts.readConfigFile(tsConfigPath, ts.sys.readFile)
  const parsedConfig = ts.parseJsonConfigFileContent(tsConfig.config, ts.sys, path.dirname(tsConfigPath))

  return parsedConfig.options.paths || {}
}

/**
 * 获取所有引用的 tsconfig.json 文件路径，包括递归引用的子项目
 * @param tsConfigPath tsconfig.json 文件路径
 * @returns 解析后的所有 tsconfig 路径
 */
function getAllProjectReferences(tsConfigPath: string): string[] {
  const tsConfig = ts.readConfigFile(tsConfigPath, ts.sys.readFile)
  const parsedConfig = ts.parseJsonConfigFileContent(tsConfig.config, ts.sys, path.dirname(tsConfigPath))

  const references = parsedConfig.projectReferences || []
  const allPaths = [tsConfigPath] // 包含当前项目

  // 递归处理引用的项目
  references.forEach((ref: ts.ProjectReference) => {
    const refPath = path.resolve(path.dirname(tsConfigPath), ref.path)
    allPaths.push(...getAllProjectReferences(refPath)) // 递归获取子项目
  })

  return allPaths
}

/**
 * 创建一个路径解析函数，支持多个项目的 paths 配置
 * @param tsConfigPath tsconfig.json 文件路径
 * @returns 路径解析函数
 */
export function createPathResolver(tsConfigPath: string = path.resolve('tsconfig.json')) {
  // 获取当前项目及其所有引用的项目的 tsconfig.json 路径
  const allProjectPaths = getAllProjectReferences(tsConfigPath)

  // 合并所有项目的 paths 配置
  let allPaths: Record<string, string[]> = {}
  allProjectPaths.forEach((configPath) => {
    const paths = getTsConfigPaths(configPath)
    allPaths = { ...allPaths, ...paths } // 合并 paths
  })

  /** 别名转换函数 */
  return (source: string, relative = false) => {
    for (const [alias, realPathArray] of Object.entries(allPaths)) {
      const regex = new RegExp(`^${alias.replace('*', '.*')}`)
      if (regex.test(source)) {
        const realPath = realPathArray[0].replace('*', source.substring(alias.length - 1))

        return relative ? realPath : path.resolve(realPath)
      }
    }
    return source
  }
}

export const resolveAliasPath = createPathResolver()
// // 示例使用：
// const tsConfigPath = path.resolve('tsconfig.json') // 主项目的 tsconfig.json 路径
// const resolvePath = createPathResolver(tsConfigPath)

// // 测试路径解析
// const resultPath = resolvePath('@/utils/helper') // 将根据 tsconfig 中的 alias 进行路径转换
// console.log(resultPath) // 输出转换后的路径
