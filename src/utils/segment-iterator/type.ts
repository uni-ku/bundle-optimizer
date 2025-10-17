/** 段落位置 */
export interface SegmentPosition {
  /** 位置类型 */
  type: 'full' | 'separator' | 'hard'
  /** 位置索引 */
  index: number
  /** 断点字符 */
  char?: string
}

/** 段落信息 */
export interface SegmentInfo {
  segment: string
  index: number
  total: number
  isFirst: boolean
  isLast: boolean
  position: SegmentPosition
}

/** 段落迭代器配置 */
export interface SegmentIteratorOptions {
  /**
   * 最大段落长度
   * @description 超过该长度则进行分段
   */
  maxLength?: number
  /** 段落断点字符列表 */
  breakChars?: string[]
  /**
   * 搜索断点字符的范围
   * @description 从 maxLength 向前和向后各扩展该范围进行断点搜索
   */
  searchRange?: number
  /** 计数时是否包含分隔符 */
  includeSeparator?: boolean
}

/** 段落迭代器 */
export interface SegmentIterator extends Iterable<SegmentInfo> {
  toArray: () => SegmentInfo[]
  map: <T>(callback: (info: SegmentInfo, index: number, total: number) => T) => T[]
  join: (separator?: string, callback?: (info: SegmentInfo) => string) => string
}

export type SegmentCallback = (info: SegmentInfo, index: number, total: number) => string
