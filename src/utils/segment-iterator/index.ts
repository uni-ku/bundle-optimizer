import type { SegmentCallback, SegmentInfo, SegmentIterator, SegmentIteratorOptions, SegmentPosition } from './type'

/**
 * 获取下一个分段
 */
function getNextSegment(text: string, options: Required<SegmentIteratorOptions>): { segment: string, position: SegmentPosition } {
  const { maxLength, breakChars, searchRange, includeSeparator } = options

  if (text.length <= maxLength) {
    return {
      segment: text,
      position: { type: 'full', index: text.length },
    }
  }

  const searchStart = Math.max(0, maxLength - searchRange)
  const searchEnd = Math.min(text.length, maxLength + searchRange)
  const searchSegment = text.substring(searchStart, searchEnd)

  let breakIndex = -1
  let breakChar = ''

  // 从后往前查找断点字符
  for (let i = searchSegment.length - 1; i >= 0; i--) {
    if (breakChars.includes(searchSegment[i])) {
      breakIndex = searchStart + i
      breakChar = searchSegment[i]
      break
    }
  }

  let segmentEnd: number
  let positionType: SegmentPosition['type']

  if (breakIndex !== -1) {
    segmentEnd = includeSeparator ? breakIndex + 1 : breakIndex
    positionType = 'separator'
  }
  else {
    segmentEnd = maxLength
    positionType = 'hard'
  }

  return {
    segment: text.substring(0, segmentEnd),
    position: {
      type: positionType,
      index: segmentEnd,
      char: breakChar,
    },
  }
}

/**
 * 计算总段数
 */
function calculateTotalSegments(text: string, options: Required<SegmentIteratorOptions>): number {
  if (!text)
    return 0

  let count = 0
  let remaining = text

  while (remaining.length > 0) {
    count++
    const segmentInfo = getNextSegment(remaining, options)
    remaining = remaining.substring(segmentInfo.segment.length)
  }

  return count
}

/**
 * 创建分段迭代器
 */
export function createSegmentIterator(text: string, options: SegmentIteratorOptions = {}): SegmentIterator {
  const defaultOptions: Required<SegmentIteratorOptions> = {
    maxLength: 100,
    breakChars: ['/', '\\', '.', '-', '_', ' ', '?', '&', '='],
    searchRange: 30,
    includeSeparator: false,
  }

  const mergedOptions: Required<SegmentIteratorOptions> = { ...defaultOptions, ...options }

  let remaining = text || ''
  let index = 0
  const totalSegments = calculateTotalSegments(text, mergedOptions)

  const iterator: SegmentIterator = {
    * [Symbol.iterator](): Generator<SegmentInfo> {
      while (remaining.length > 0) {
        const segmentInfo = getNextSegment(remaining, mergedOptions)
        const segment = segmentInfo.segment
        const isLast = remaining.length === segment.length

        const result: SegmentInfo = {
          segment,
          index,
          total: totalSegments,
          isFirst: index === 0,
          isLast,
          position: segmentInfo.position,
        }

        remaining = remaining.substring(segment.length)
        index++

        yield result
      }
    },

    toArray(): SegmentInfo[] {
      return Array.from(this)
    },

    map<T>(callback: (info: SegmentInfo, index: number, total: number) => T): T[] {
      const results: T[] = []
      let currentIndex = 0

      for (const segmentInfo of this) {
        const result = callback(segmentInfo, currentIndex, totalSegments)
        results.push(result)
        currentIndex++
      }

      return results
    },

    join(separator: string = '', callback?: (info: SegmentInfo, index: number) => string): string {
      const segments: string[] = []
      let currentIndex = 0

      for (const segmentInfo of this) {
        const segmentText = callback
          ? callback(segmentInfo, currentIndex)
          : segmentInfo.segment
        segments.push(segmentText)
        currentIndex++
      }

      return segments.join(separator)
    },
  }

  return iterator
}

/**
 * 分段处理器基础封装
 */
export function processSegments(
  text: string,
  options: SegmentIteratorOptions = {},
  callback?: SegmentCallback,
  joinSeparator: string = '<br/>',
): string {
  const iterator = createSegmentIterator(text, options)

  if (callback) {
    return iterator.join(joinSeparator, info => callback(info, info.index, info.total))
  }

  return iterator.join(joinSeparator)
}

// /**
//  * 预置特定类型的分段器
//  */
// // eslint-disable-next-line ts/no-namespace, unused-imports/no-unused-vars
// namespace Segmenters {
//   export function createPathSegmenter(maxLength: number = 100): (text: string) => SegmentIterator {
//     return (text: string) => createSegmentIterator(text, {
//       maxLength,
//       breakChars: ['/', '\\'],
//       includeSeparator: true,
//     })
//   }

//   export function createTextSegmenter(maxLength: number = 80): (text: string) => SegmentIterator {
//     return (text: string) => createSegmentIterator(text, {
//       maxLength,
//       breakChars: [' ', ',', '.', ';', ':', '!', '?'],
//       includeSeparator: false,
//     })
//   }

//   export function createCodeSegmenter(maxLength: number = 80): (text: string) => SegmentIterator {
//     return (text: string) => createSegmentIterator(text, {
//       maxLength,
//       breakChars: ['.', ',', ';', '(', ')', '{', '}', '[', ']', '=', '+', '-', '*', '/'],
//       includeSeparator: false,
//     })
//   }
// }
