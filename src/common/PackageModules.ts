import type { ManualChunkMeta, ModuleInfo } from 'rollup'

// **直接**引入到包内的`模块A`是能被得知并编译到包内的
// 而`模块A`引入的`模块B`是不能被得知的，因为`模块A`是`模块B`的引入者，`模块B`是`模块A`的依赖
// 当下的模式，`模块B`是不能被明确得知是属于哪个包的，所以需要以下工具类来处理这种情况
// 实现链式依赖的查找
export class PackageModules {
  /**
   * 包的模块信息记录
   *
   * @description 记录一个包中引入的模块信息
   */
  private modulesRecord: { [packageId: string]: { [moduleId: string]: ModuleInfo } } = {}

  public chunkMeta: null | ManualChunkMeta = null

  moduleIdProcessor: (moduleId: string) => string = id => id

  constructor(moduleIdProcessor?: typeof this.moduleIdProcessor) {
    if (moduleIdProcessor && typeof moduleIdProcessor === 'function')
      this.moduleIdProcessor = moduleIdProcessor
  }

  static isCommonJsModule(moduleInfo: ModuleInfo) {
    return !!moduleInfo?.meta?.commonjs?.isCommonJS
  }

  /**
   * add module record
   */
  public addModuleRecord(packageId: string, moduleInfo: ModuleInfo) {
    let moduleId = moduleInfo.id
    if (!moduleId)
      return

    moduleId = this.moduleIdProcessor(moduleId)

    if (!moduleId)
      return

    if (!this.modulesRecord[packageId]) {
      this.modulesRecord[packageId] = {}
    }

    this.modulesRecord[packageId][moduleId] = moduleInfo
  }

  /**
   * clear module record
   */
  public clearModuleRecord() {
    return this.modulesRecord = {}
  }

  /**
   * find module record in `importers`
   * @param importers 模块引入者列表 | 哪些模块引入了该模块之意
   * @param moduleIdProcessor 模块id处理器 - 可选
   * @description 查找`引入者列表`中是否有属于`modulesRecord`中的模块，返回命中的模块信息
   * @description 这意味着查找`modulesRecord`中的哪些包引入了该模块，说明这个模块是引入这个包内的依赖的链式依赖（依赖的依赖）
   */
  public findModuleInImporters(importers: readonly string[], moduleIdProcessor?: typeof this.moduleIdProcessor | null) {
    return importers.reduce((pkgs, importerId) => {
      for (const packageId in this.modulesRecord) {
        const _moduleIdProcessor = moduleIdProcessor || this.moduleIdProcessor
        const moduleId = _moduleIdProcessor(importerId)

        if (this.modulesRecord[packageId][moduleId]) {
          // 说明这个`包`的某个依赖引入了这个`模块`，记录下来
          pkgs[packageId] = this.modulesRecord[packageId]
        }
      }
      return pkgs
    }, {} as typeof this.modulesRecord)
  }

  /**
   * @deprecated 暂时没有使用的场景
   */
  public findModuleImported(moduleId: string) {
    return Object.entries(this.modulesRecord).reduce((pkgs, [packageId, packageModules]) => {
      const tempModule = packageModules[moduleId]
      if (tempModule) {
        pkgs[packageId] = packageModules
      }
      return pkgs
    }, {} as typeof this.modulesRecord)
  }

  /**
   * process module
   * @description 处理commonjs模块的链式依赖
   */
  public processModule(moduleInfo: ModuleInfo): [string | null | undefined, ModuleInfo] | null | undefined {
    let resultPackageId: string | null = null
    for (const packageId in this.modulesRecord) {
      const packageModules = this.modulesRecord[packageId]
      for (const moduleId in packageModules) {
        const itemInfo = packageModules[moduleId]
        if (itemInfo.importedIds?.some(importedId => importedId.includes(moduleInfo.id))) {
          resultPackageId = packageId
          break
        }
      }
      if (resultPackageId) {
        break
      }
    }
    if (resultPackageId) {
      this.addModuleRecord(resultPackageId, moduleInfo)
      return [resultPackageId, moduleInfo]
    }
  }
}

export default PackageModules
