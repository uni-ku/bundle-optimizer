/* eslint-disable no-console */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable node/prefer-global/process */
import type { Plugin } from 'vite'
import type { ISubPkgsInfo, ManualChunkMeta, ManualChunksOption, ModuleInfo } from './type'
import fs from 'node:fs'
import path from 'node:path'
import { parseManifestJsonOnce, parseMiniProgramPagesJson } from '@dcloudio/uni-cli-shared'
import { logger } from './common/Logger'
import { EXTNAME_JS_RE, ROOT_DIR } from './constants'
import { moduleIdProcessor as _moduleIdProcessor, normalizePath } from './utils'

/**
 * uniapp 分包优化插件
 */
export function UniappSubPackagesOptimization(enableLogger: boolean): Plugin {
  const platform = process.env.UNI_PLATFORM
  const inputDir = process.env.UNI_INPUT_DIR

  if (!platform || !inputDir) {
    throw new Error('`UNI_INPUT_DIR` or `UNI_PLATFORM` is not defined')
  }

  // #region 分包优化参数获取
  const manifestJson = parseManifestJsonOnce(inputDir)
  const platformOptions = manifestJson[platform] || {}
  const optimization = platformOptions.optimization || {}
  process.env.UNI_OPT_TRACE = `${!!optimization.subPackages}`

  const pagesJsonPath = path.resolve(inputDir, 'pages.json')
  const jsonStr = fs.readFileSync(pagesJsonPath, 'utf8')
  const { appJson } = parseMiniProgramPagesJson(jsonStr, platform, { subpackages: true })
  process.UNI_SUBPACKAGES = appJson.subPackages || {}
  // #endregion

  // #region subpackage
  const UNI_SUBPACKAGES = process.UNI_SUBPACKAGES || {}
  const subPkgsInfo: ISubPkgsInfo[] = Object.values(UNI_SUBPACKAGES)
  const normalFilter = ({ independent }: ISubPkgsInfo) => !independent
  const independentFilter = ({ independent }: ISubPkgsInfo) => independent
  /** 先去除尾部的`/`，再添加`/`，兼容pages.json中以`/`结尾的路径 */
  const map2Root = ({ root }: ISubPkgsInfo) => `${root.replace(/\/$/, '')}/`
  const subPackageRoots = subPkgsInfo.map(map2Root)
  const normalSubPackageRoots = subPkgsInfo.filter(normalFilter).map(map2Root)
  const independentSubpackageRoots = subPkgsInfo.filter(independentFilter).map(map2Root)

  /**
   * # id处理器
   * @description 将id中的moduleId转换为相对于inputDir的路径并去除查询参数后缀
   */
  function moduleIdProcessor(id: string) {
    return _moduleIdProcessor(id, process.env.UNI_INPUT_DIR)
  }
  /**
   * 判断该文件模块的来源
   */
  const moduleFrom = (id: string):
    { from: 'main' | 'node_modules', clearId: string }
    | { from: 'sub', clearId: string, pkgRoot: string }
    | undefined => {
    let root = normalizePath(ROOT_DIR)
    if (!root.endsWith('/'))
      root = `${root}/`

    const clearId = moduleIdProcessor(id)

    if (!path.isAbsolute(clearId)) {
      const pkgRoot = normalSubPackageRoots.find(root => moduleIdProcessor(clearId).indexOf(root) === 0)
      if (pkgRoot === undefined)
        return { from: clearId.startsWith('node_modules/') ? 'node_modules' : 'main', clearId }
      else
        return { from: 'sub', clearId, pkgRoot }
    }
    else {
      // clearId.startsWith(root) && TODO: 放宽条件，兼容 workspace 项目
      if (clearId.includes('/node_modules/'))
        return { from: 'node_modules', clearId }
    }
  }

  /** 查找模块列表中是否有属于子包的模块 */
  const findSubPackages = function (importers: readonly string[]) {
    return importers.reduce((pkgs, item) => {
      const pkgRoot = normalSubPackageRoots.find(root => moduleIdProcessor(item).indexOf(root) === 0)
      pkgRoot && pkgs.add(pkgRoot)
      return pkgs
    }, new Set<string>())
  }

  /** 判断是否有非子包的import (是否被非子包引用) */
  const hasNoSubPackage = function (importers: readonly string[]) {
    return importers.some((item) => {
      // 遍历所有的子包根路径，如果模块的路径不包含子包路径，就说明被非子包引用了
      return !subPackageRoots.some(root => moduleIdProcessor(item).indexOf(root) === 0)
    })
  }
  /** 判断是否有来自`node_modules`下的依赖 */
  const hasNodeModules = function (importers: readonly string[]) {
    return hasNoSubPackage(importers) && importers.some((item) => {
      return moduleIdProcessor(item).includes('node_modules')
    })
  }
  /** 查找来自 主包 下的依赖 */
  const findMainPackage = function (importers: readonly string[]) {
    const list = importers.filter((item) => {
      const id = moduleIdProcessor(item)
      // 排除掉子包和第三方包之后，剩余的视为主包
      return !subPackageRoots.some(root => id.indexOf(root) === 0) && !id.includes('node_modules')
    })
    return list
  }
  /** 查找来自 主包 下的组件 */
  const findMainPackageComponent = function (importers: readonly string[]) {
    const list = findMainPackage(importers)
    const mainPackageComponent = new Set(list
      .map(item => moduleIdProcessor(item))
      .filter(name => name.endsWith('.vue') || name.endsWith('.nvue')))
    return mainPackageComponent
  }
  /** 判断是否含有项目入口文件的依赖 */
  const hasEntryFile = function (importers: readonly string[], meta: ManualChunkMeta) {
    const list = findMainPackage(importers)
    return list.some(item => meta.getModuleInfo(item)?.isEntry)
  }
  /** 判断该模块引用的模块是否有跨包引用的组件 */
  const hasMainPackageComponent = function (moduleInfo: Partial<ModuleInfo>, subPackageRoot?: string) {
    if (moduleInfo.id && moduleInfo.importedIdResolutions) {
      for (let index = 0; index < moduleInfo.importedIdResolutions.length; index++) {
        const m = moduleInfo.importedIdResolutions[index]

        if (m && m.id) {
          const name = moduleIdProcessor(m.id)
          // 判断是否为组件
          if (name.includes('.vue') || name.includes('.nvue')) {
            // 判断存在跨包引用的情况(该组件的引用路径不包含子包路径，就说明跨包引用了)
            if (subPackageRoot && !name.includes(subPackageRoot)) {
              if (process.env.UNI_OPT_TRACE) {
                console.log('move module to main chunk:', moduleInfo.id, 'from', subPackageRoot, 'for component in main package:', name)
              }

              // 独立分包除外
              const independentRoot = independentSubpackageRoots.find(root => name.includes(root))
              if (!independentRoot) {
                return true
              }
            }
          }
          else {
            return hasMainPackageComponent(m, subPackageRoot)
          }
        }
      }
    }
    return false
  }
  // #endregion

  logger.info('[optimization] 分包优化插件已启用', !enableLogger)

  return {
    name: 'uniapp-subpackages-optimization',
    enforce: 'post', // 控制执行顺序，post 保证在其他插件之后执行
    config(config, { command }) {
      if (!platform.startsWith('mp')) {
        logger.warn('[optimization] 分包优化插件仅需在小程序平台启用，跳过', !enableLogger)
        return
      }

      const UNI_OPT_TRACE = process.env.UNI_OPT_TRACE === 'true'
      logger.info(`[optimization] 分包优化开启状态: ${UNI_OPT_TRACE}`, !true) // !!! 此处始终开启log
      if (!UNI_OPT_TRACE)
        return

      const originalOutput = config?.build?.rollupOptions?.output

      const existingManualChunks
        = (Array.isArray(originalOutput) ? originalOutput[0]?.manualChunks : originalOutput?.manualChunks) as ManualChunksOption

      // 合并已有的 manualChunks 配置
      const mergedManualChunks: ManualChunksOption = (id, meta) => {
        /** 依赖图谱分析 */
        function getDependencyGraph(startId: string, getRelated: (info: ModuleInfo) => readonly string[] = info => info.importers): string[] {
          const visited = new Set<string>()
          const result: string[] = []

          // 支持自定义遍历方向的泛化实现
          function traverse(
            currentId: string,
            getRelated: (info: ModuleInfo) => readonly string[], // 控制遍历方向的回调函数
          ) {
            if (visited.has(currentId))
              return

            visited.add(currentId)
            result.push(currentId)

            const moduleInfo = meta.getModuleInfo(currentId)
            if (!moduleInfo)
              return

            getRelated(moduleInfo).forEach((relatedId) => {
              traverse(relatedId, getRelated)
            })
          }

          // 示例：向上追踪 importers（谁导入了当前模块）
          traverse(startId, getRelated)

          // 若需要向下追踪 dependencies（当前模块导入了谁）：
          // traverse(startId, (info) => info.dependencies);

          return result
        }

        const normalizedId = normalizePath(id)
        const filename = normalizedId.split('?')[0]

        // #region ⚠️ 以下代码是分包优化的核心逻辑
        // 处理项目内的js,ts文件
        if (EXTNAME_JS_RE.test(filename) && (filename.startsWith(inputDir) || filename.includes('node_modules'))) {
          // 如果这个资源只属于一个子包，并且其调用组件的不存在跨包调用的情况，那么这个模块就会被加入到对应的子包中。
          const moduleInfo = meta.getModuleInfo(id)
          if (!moduleInfo) {
            throw new Error(`moduleInfo is not found: ${id}`)
          }
          const importers = moduleInfo.importers || [] // 依赖当前模块的模块id
          const matchSubPackages = findSubPackages(importers)
          // 查找直接引用关系中是否有主包的组件文件模块
          const mainPackageComponent = findMainPackageComponent(importers)
          // 是否有被项目入口文件直接引用
          const isEntry = hasEntryFile(importers, meta)

          const moduleFromInfos = moduleFrom(id)

          let isMain = false
          if (
            // 未知来源的模块、commonjsHelpers => 打入主包
            (!moduleFromInfos || moduleFromInfos.clearId === 'commonjsHelpers.js')
            // 被入口文件直接引用的 => 打入主包
            || isEntry
            // 主包未被引用的模块 => 打入主包（要么是项目主入口文件、要么就是存在隐式引用）
            // 主包没有匹配到子包的引用 => 打入主包（只被主包引用）
            || (moduleFromInfos.from === 'main' && (!importers.length || !matchSubPackages.size))
            // 直系（浅层）依赖判断：匹配到存在主包组件的引用
            || mainPackageComponent.size > 0
            // 直系（浅层）依赖判断：匹配到多个子包的引用 => 打入主包
            || matchSubPackages.size > 1
          ) {
            // 这里使用 flag 控制，而不能使用 return
            // 直接 return 和 return "common/vendor" 都是不对的
            // 直接放空，让后续的插件自行抉择
            isMain = true
          }

          if (!isMain) {
            // 直系（浅层）判断 => 打入子包（必须判断是否有没有非子包的引用的模块，因为暂时无法判断第三方的模块的依赖链的情况）
            if (matchSubPackages.size === 1 && !hasNoSubPackage(importers)) {
              return `${matchSubPackages.values().next().value}common/vendor`
            }

            // #region 👋 此处的逻辑完全可以取代前面的所有分支判断
            // 但是保留前面的过程，是因为当前逻辑是耗时的，提前通过一些浅显的判断判定引用结果
            const importersGraph = getDependencyGraph(id) // 搜寻引用图谱
            const newMatchSubPackages = findSubPackages(importersGraph)
            // 查找引用图谱中是否有主包的组件文件模块
            const newMainPackageComponent = findMainPackageComponent(importersGraph)

            // 引用图谱中只找到一个子包的引用，并且没有出现主包的组件以及入口文件(main.{ts|js})，则说明只归属该子包
            if (!isEntry && newMatchSubPackages.size === 1 && newMainPackageComponent.size === 0) {
              return `${newMatchSubPackages.values().next().value}common/vendor`
            }
            // #endregion
          }
        }
        // #endregion

        // 调用已有的 manualChunks 配置 ｜ 此处必须考虑到原有的配置，是为了使 uniapp 原本的分包配置生效
        if (existingManualChunks && typeof existingManualChunks === 'function')
          return existingManualChunks(id, meta)
      }

      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks: mergedManualChunks,
            },
          },
        },
      }
    },
  }
}

export default UniappSubPackagesOptimization
