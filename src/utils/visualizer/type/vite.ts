import type { GraphLink } from './base.link'
import type { GraphBaseNode } from './base.node'

enum ViteNodeType {
  ASSET = 'asset',
  CHUNK = 'chunk',
}

enum ViteNodeLinkType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

export interface ViteBaseNode extends GraphBaseNode<`${ViteNodeType}`> {
  /**
   * 节点类别索引
   * @description 此处主要是为了兼容 echarts，取分类在列表的索引
   */
  category?: number
}

export interface ViteChunkNode extends ViteBaseNode {
  type: 'chunk'
  /** 是否为打包入口 */
  isEntry: boolean
  code?: string | null
}

export interface ViteAssetNode extends ViteBaseNode {
  type: 'asset'
  /**
   * 资源类型
   * @description 一般是文件扩展名
   */
  resourceType: string
  /** 资源内容 */
  source?: string | Uint8Array
}

export type ViteNode = ViteChunkNode | ViteAssetNode
export type ViteNodeLink = GraphLink<`${ViteNodeLinkType}`>
