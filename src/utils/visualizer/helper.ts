import type { GraphRestrictArea } from './type'

/** 预处理后的数据结构，存储排序后的ID和原始Map */
interface ProcessedAreaMatcher {
  /** ID 列表，按长度从长到短排序 */
  sortedIds: string[]
  /** ID 到对象的快速查找 Map (O(1) 查找) */
  areaMap: Map<string, GraphRestrictArea>
}

/**
 * 预处理 GraphRestrictArea 数组，用于前缀匹配查找。
 * @description 确保 id 唯一性
 */
function preProcessAreasForPrefixMatch(arr: GraphRestrictArea[] = []): ProcessedAreaMatcher {
  const areaMap = new Map<string, GraphRestrictArea>()

  // O(n) 填充 Map
  for (const area of arr) {
    areaMap.set(area.id, area)
  }

  // O(n log n) 提取 ID 并按长度从长到短排序 (贪婪匹配的关键)
  const sortedIds = Array.from(areaMap.keys()).sort((a, b) => b.length - a.length)

  return { sortedIds, areaMap }
}

/** 基于前缀的匹配 */
function createCommonMatcher(id: string) {
  return (targetString: string) => targetString.startsWith(`${id}/`)
}

type CreateMatcher<T extends string> = (id: string) => (targetString: string) => T | boolean

/**
 * 使用预处理后的数据结构，通过对应的 matcher 查找匹配的区域。
 */
export function findAreaByMatcher<T extends string>(
  processedData: ProcessedAreaMatcher,
  targetString?: string,
  createMatcher: CreateMatcher<T> = createCommonMatcher,
): [GraphRestrictArea | undefined, boolean | T | undefined] {
  if (targetString === undefined) {
    return [undefined, false]
  }
  // 遍历排序后的 ID (从最长开始)
  for (const id of processedData.sortedIds) {
    const matcher = createMatcher(id)
    const matcheRes = matcher(targetString)
    if (matcheRes) {
      return [processedData.areaMap.get(id), matcheRes]
    }
  }

  // 额外的检查：如果目标字符串恰好等于某个 ID (即不是以 / 结尾的路径)
  // 例如 ID 是 '/root'，目标也是 '/root'。
  if (processedData.areaMap.has(targetString)) {
    return [processedData.areaMap.get(targetString), true]
  }
  return [undefined, false]
}

export function createRestrictAreaSearcher<T extends string>(
  restrictAreas?: GraphRestrictArea[],
  createMatcher: CreateMatcher<T> = createCommonMatcher,
) {
  const preprocessAreas = preProcessAreasForPrefixMatch(restrictAreas)
  return (targetId?: string) => findAreaByMatcher(preprocessAreas, targetId, createMatcher)
}
