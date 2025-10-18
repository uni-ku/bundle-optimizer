/** 节点类型 */
export enum GraphNodeType {
  ASSET = 'asset',
  CHUNK = 'chunk',
}

/**
 * 基础节点
 */
export interface GraphBaseNode {
  /** 唯一标识符，直接使用 Rollup 的 module.id */
  id: string
  name: string
  label?: string
  /** 节点类型 */
  type: `${GraphNodeType}`
  /** 节点的权重值 */
  value?: number
  /** 节点类别索引 */
  category?: number
}

export interface GraphChunkNode extends GraphBaseNode {
  type: 'chunk'
  /** 是否为打包入口 */
  isEntry: boolean
  /** 是否为外部依赖 */
  isExternal: boolean
  code?: string | null
}

export interface GraphAssetNode extends GraphBaseNode {
  type: 'asset'
  /**
   * 资源类型
   * @description 一般是文件扩展名
   */
  resourceType: string
  /** 资源内容 */
  source?: string | Uint8Array
}

export type GraphNode = GraphChunkNode | GraphAssetNode
