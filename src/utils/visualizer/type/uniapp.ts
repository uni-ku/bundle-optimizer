import type { GraphAssetNode, GraphChunkNode } from './base.node'

// 脚本文件: 特指 JS/TS 脚本文件
// 静态资源: 图片、JSON（编译成js）、Worker 文件、Web Assembly 文件
// 样式文件: CSS/SCSS/LESS 文件（特殊的静态资源？）
// 模版文件: vue 文件（最后会被响应得编译为脚本文件、样式文件、最终的模版文件）

enum ModuleChunkType {
  SCRIPT = 'script',
}

enum ModuleAssetType {
  TEMPLATE = 'template',
  STATIC = 'static',
  STYLE = 'style',
}

type ModuleType = ModuleChunkType | ModuleAssetType

interface ModuleInfo {
  type: `${ModuleType}`
  /** 模块名 */
  name: string
  /** 模块路径 */
  path: string
}

enum PackageType {
  MAIN = 'main',
  SUBPACKAGE = 'subpackage',
  /**
   * 子包的一种
   * @description 独立分包，通常是指不依赖主包，可以单独加载的分包
   */
  INDEPENDENT = 'independent',
}

interface PackageInfo {
  type: `${PackageType}`
  /** 包名 */
  name: string
  /** 一般是去除项目基本路径的包路径 */
  path: string
  /** 完整包路径 */
  fullPath: string
}

interface UniappGraphBaseNode {
  moduleInfo: ModuleInfo
  /** 模块的初始归属包 */
  initialPackage: PackageInfo
  /**
   * 经过分析后，最终决策的归属包
   */
  finalPackage?: PackageInfo
  /**
   * 模块的估算大小 (字节)，用于后续优化决策的量化分析
   * 可以通过 code.length 粗略估算
   */
  sizeInBytes?: number
  isPage?: boolean // 是否为页面
}

export interface UniappGraphChunkNode extends UniappGraphBaseNode, GraphChunkNode {
  moduleInfo: ModuleInfo & { type: `${ModuleChunkType}` }
}

export interface UniappGraphAssetNode extends UniappGraphBaseNode, GraphAssetNode {
  moduleInfo: ModuleInfo & { type: `${ModuleAssetType}` }
}

export type UniappGraphNode = UniappGraphChunkNode | UniappGraphAssetNode
