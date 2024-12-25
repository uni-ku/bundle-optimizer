/* eslint-disable no-console */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable node/prefer-global/process */
import type { GetManualChunk, ModuleInfo, RollupOptions } from 'rollup'
import type { Plugin } from 'vite'
import type { ISubPkgsInfo } from './type'
import fs from 'node:fs'
import path from 'node:path'
import { parseManifestJsonOnce, parseMiniProgramPagesJson } from '@dcloudio/uni-cli-shared'
import { logger } from './common/Logger'
import { PackageModules } from './common/PackageModules'
import { EXTNAME_JS_RE } from './constants'
import { moduleIdProcessor as _moduleIdProcessor, normalizePath } from './utils'

/**
 * uniapp 分包优化插件
 */
export function UniappSubPackagesOptimization(): Plugin {
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

  const PackageModulesInstance = new PackageModules(moduleIdProcessor)

  /**
   * # id处理器
   * @description 将id中的moduleId转换为相对于inputDir的路径并去除查询参数后缀
   */
  function moduleIdProcessor(id: string) {
    return _moduleIdProcessor(id, process.env.UNI_INPUT_DIR)
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

  logger.info('[optimization] 分包优化插件已启用')

  return {
    name: 'uniapp-subpackages-optimization',
    enforce: 'post', // 控制执行顺序，post 保证在其他插件之后执行
    config(config, { command }) {
      if (!platform.startsWith('mp')) {
        logger.warn('[optimization] 分包优化插件仅需在小程序平台启用，跳过')
        return
      }

      const UNI_OPT_TRACE = process.env.UNI_OPT_TRACE === 'true'
      logger.info(`[optimization] 分包优化开启状态: ${UNI_OPT_TRACE}`)
      if (!UNI_OPT_TRACE)
        return

      const originalOutput = config?.build?.rollupOptions?.output

      const existingManualChunks
      = (Array.isArray(originalOutput) ? originalOutput[0]?.manualChunks : originalOutput?.manualChunks) as GetManualChunk

      // 合并已有的 manualChunks 配置
      const mergedManualChunks: GetManualChunk = (id, meta) => {
        const normalizedId = normalizePath(id)
        const filename = normalizedId.split('?')[0]

        // #region ⚠️ 以下代码是分包优化的核心逻辑
        // 处理项目内的js,ts文件
        if (EXTNAME_JS_RE.test(filename) && (!filename.startsWith(inputDir) || filename.includes('node_modules'))) {
          // 如果这个资源只属于一个子包，并且其调用组件的不存在跨包调用的情况，那么这个模块就会被加入到对应的子包中。
          const moduleInfo = meta.getModuleInfo(id)
          if (!moduleInfo) {
            throw new Error(`moduleInfo is not found: ${id}`)
          }
          const importers = moduleInfo.importers || [] // 依赖当前模块的模块id
          const matchSubPackages = findSubPackages(importers)
          let subPackageRoot: string | undefined = matchSubPackages.values().next().value

          const matchSubpackageModules = PackageModulesInstance.findModuleInImporters(importers) || {}
          const matchSubpackage = Object.keys(matchSubpackageModules)[0] // 当前仅支持一个子包引用
          /**
           * - 强制将commonjsHelpers.js放入主包，即使这样主包会大1kb左右
           * - 当主包、分包都需要commonjsHelpers.js时，子包会从主包引入commonjsHelpers.js
           * - 但是子包热更新时，会出现问题主包从分包中引入commonjsHelpers.js的情况，这是不允许的，
           * - 虽然重新运行可以解决问题，但是这样开发体验不好
           */
          const isCommonjsHelpers = id.includes('commonjsHelpers.js')

          if (!isCommonjsHelpers) {
            if (((matchSubPackages.size === 1 && !hasNoSubPackage(importers))
              || (matchSubpackage && hasNodeModules(importers) // 再次确定此模块来自`node_modules`
              ))
              && !hasMainPackageComponent(moduleInfo, subPackageRoot)
            ) {
              if (!subPackageRoot) {
                subPackageRoot = matchSubpackage
              }
              PackageModulesInstance.addModuleRecord(subPackageRoot, moduleInfo) // 模块引入子包记录，用于链式依赖的索引

              return `${subPackageRoot}common/vendor`
            }
            else {
              const result = PackageModulesInstance.processModule(moduleInfo)
              if (result?.[0]) {
                return `${result[0]}common/vendor`
              }
            }
          }
        }
        // #endregion

        // 调用已有的 manualChunks 配置 ｜ 此处必须考虑到原有的配置，是为了使 uniapp 原本的分包配置生效
        if (existingManualChunks)
          return existingManualChunks(id, meta)
      }

      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks: mergedManualChunks,
            },
          } as RollupOptions,
        },
      }
    },
    buildStart() {
      // 每次新的打包时，清空`模块记录`，主要避免热更新时上次构建时的`模块记录`导致热更新构建混乱
      PackageModulesInstance.clearModuleRecord()
    },
  }
}

export default UniappSubPackagesOptimization
