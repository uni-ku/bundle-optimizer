import type { GraphBaseNode } from './base.node'

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

/** 受限锚点 */
export interface GraphRestrictAnchor {
  /** 受限域信息 */
  area: GraphRestrictArea
  /**
   * 唯一标识
   * @description 如果是文件系统可以用文件路径，不作限制
   */
  id: string
}

/** 受限节点 */
export interface RestrictGraphNode<T extends string = string> extends GraphRestrictAnchor, GraphBaseNode<T> {
}
