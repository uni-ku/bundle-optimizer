/**
 * 基础节点
 */
export interface GraphBaseNode<T extends string = string> {
  /** 唯一标识符，直接使用 Rollup 的 module.id */
  id: string
  /** 简短文本 */
  name: string
  /** 业务需求的显示文本 */
  label?: string
  /** 节点类型 */
  type: T
  /**
   * 节点的权重值
   * @TODO: 权重值其实是业务概念；
   * 后续将展示节点的出度、入度，废弃此字段
   */
  value?: number
}
