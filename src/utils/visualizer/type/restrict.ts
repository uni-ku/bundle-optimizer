import type { GraphAssetNode, GraphChunkNode } from './base.node'

/**
 * 图形受限域
 */
export interface GraphRestrictArea {
  /**
   * 唯一标识
   * @description 如果是文件系统可以用相同系列模块的基础路径，当然不作限制
   */
  id: string
  /** 简短文本 */
  name: string
  /** 业务需求的显示文本 */
  label?: string
  /**
   * 限制等级
   * @description 起始等级为0，限制等级越高，说明深入的层次越深，具体业务含义可自行赋予
   */
  level?: number
}

/** 受限作用锚点 */
export interface GraphRestrictAnchor {
  /** 受限域id */
  areaId: string
  /**
   * 唯一标识
   * @description 如果是文件系统可以用文件路径，不作限制
   */
  id: string
}

/** 受限 Chunk 节点 */
export interface RestrictGraphChunkNode extends GraphRestrictAnchor, GraphChunkNode {
}

/** 受限 Asset 节点 */
export interface RestrictGraphAssetNode extends GraphRestrictAnchor, GraphAssetNode {
}

/** 受限节点 */
export type RestrictGraphNode = RestrictGraphChunkNode | RestrictGraphAssetNode
