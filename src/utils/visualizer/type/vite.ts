import type { GraphLink } from './base.link'
import type { GraphBaseNode } from './base.node'
import type { RestrictGraphNode } from './base.restrict'

enum ViteNodeType {
  ASSET = 'asset',
  CHUNK = 'chunk',
}

interface BaseNode {
  /**
   * 节点类别
   * @description 分组作用
   */
  category?: string

  /**
   * 节点类别索引
   * @description 此处主要是为了兼容 echarts，取分类在列表的索引
   */
  categoryIndex?: number
}

export type ViteBaseNode = BaseNode & GraphBaseNode<`${ViteNodeType}`>
export type ViteRestrictBaseNode = BaseNode & RestrictGraphNode<`${ViteNodeType}`>

interface ChunkNode {
  type: 'chunk'
  /** 是否为打包入口 */
  isEntry: boolean
  code?: string | null
}

interface AssetNode {
  type: 'asset'
  /**
   * 资源类型
   * @description 一般是文件扩展名
   */
  resourceType: string
  /** 资源内容 */
  source?: string | Uint8Array
}

export type ViteChunkNode = ChunkNode & ViteBaseNode
export type ViteAssetNode = AssetNode & ViteBaseNode
export type ViteNode = ViteChunkNode | ViteAssetNode

export type ViteRestrictChunkNode = ChunkNode & ViteRestrictBaseNode
export type ViteRestrictAssetNode = AssetNode & ViteRestrictBaseNode
export type ViteRestrictNode = ViteRestrictChunkNode | ViteRestrictAssetNode

enum ViteNodeLinkType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

export type ViteNodeLink = GraphLink<`${ViteNodeLinkType}`>
