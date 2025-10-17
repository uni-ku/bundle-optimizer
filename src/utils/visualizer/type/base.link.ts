/**
 * 节点连接关系
 */
export interface GraphLink {
  /** 依赖来源方的 id */
  source: string

  /** 被依赖方的 id */
  target: string

  /**
   * 边的类型
   */
  type: 'static' | 'dynamic'
}
