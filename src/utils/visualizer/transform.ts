import type { ManualChunkMeta } from '../../type'
import type { GraphRestrictArea, ViteNode, ViteNodeLink, ViteRestrictNode } from './type'
import path from 'node:path'
import { parseQuerystring } from '..'
import { parseVirtualPath } from '../uniapp'
import { createRestrictAreaSearcher } from './helper'

/**
 * 从模块 ID 中解析出干净的文件名和扩展名。
 * @param id - Rollup 模块 ID
 */
function parseModuleId(id: string): { fileName: string, ext: string, name: string } {
  // 移除 Vite/Rollup 可能添加的前缀 (如 \0)
  const cleanedId = id.replace(/^\0/, '')
  const ext = path.extname(cleanedId)
  const fileName = path.basename(cleanedId)
  const name = path.basename(cleanedId, ext) // 不含扩展名的文件名
  return { fileName, ext: ext.slice(1), name }
}

/** uniapp 项目的匹配模式 */
function createUniappMatcher(id: string) {
  const matchString = `${id}/index.vue`
  const getBasePath = (path: string): string => {
    const qIndex = path.indexOf('?')
    return qIndex !== -1 ? path.substring(0, qIndex) : path
  }

  return (targetString: string) => {
    const [is, result, _] = parseVirtualPath(targetString)

    // 如果是 uniapp 的组件虚拟路径
    if (is) {
      // result 可能是相对路径
      return result === matchString || matchString.endsWith(`/${result}`)
    }

    const basePath = getBasePath(targetString)
    if (basePath === matchString) {
      const parsedUrl = parseQuerystring(targetString)
      // 检查是否是无参数的完全匹配，或者有查询参数的 script 类型
      if (!parsedUrl || (parsedUrl.type === 'script' && parsedUrl.vue === true)) {
        return true
      }
      // ?vue&type=style&lang.css
      if (parsedUrl.type === 'style' && parsedUrl.vue === true && targetString.endsWith('.css')) {
        return 'css'
      }
    }

    return false
  }
}

type MergeNode<N extends ViteRestrictNode | ViteNode, D = unknown> = D extends object ? N & D : N
type AsNode<Restrict extends boolean = false, D = unknown> =
    Restrict extends true
      ? MergeNode<ViteRestrictNode, D>
      : MergeNode<ViteNode, D>

interface TransformRes<Restrict extends boolean = false, D = unknown> {
  nodes: Array<AsNode<Restrict, D>>
  links: ViteNodeLink[]
}

interface TransformDataFunction {
  /**
   * 将 Rollup/Vite 的模块图数据转换为 ECharts 可用的格式
   * @param pluginContext - Rollup 插件的上下文对象 (`this`)
   * @returns 包含 nodes 和 links 的对象
   */
  <T extends ViteNode, D extends T>(
    pluginContext: ManualChunkMeta,
    onSet?: (node: T) => D
  ): TransformRes<false, D>

  /**
   * 将 Rollup/Vite 的模块图数据转换为 ECharts 可用的格式
   * @param pluginContext - Rollup 插件的上下文对象 (`this`)
   * @param restrictAreas - 受限域信息（需要含有 children 内容）
   * @returns 包含 nodes 和 links 的对象
   */
  <T extends ViteRestrictNode, D extends T>(
    pluginContext: ManualChunkMeta,
    onSet?: (node: T) => D,
    restrictAreas?: GraphRestrictArea[]
  ): TransformRes<true, D>
}

export const transformDataForECharts: TransformDataFunction = <T extends ViteRestrictNode | ViteNode, D extends T>(
  pluginContext: ManualChunkMeta,
  onSet?: (node: T) => D,
  restrictAreas?: GraphRestrictArea[],
) => {
  const nodeMap = new Map<string, D>()
  const links: ViteNodeLink[] = []

  // TODO: 在加入 map 时，从 restrictAreas 查找 node.id 是否在对应的受限域中
  const restrictAreaSearcher = createRestrictAreaSearcher(restrictAreas, createUniappMatcher)

  const execOnSet = (node: T): D => {
    if (typeof onSet === 'function') {
      const target = onSet(node)
      if (typeof target === 'object')
        return target
    }
    return node as D
  }

  // =================================================================
  // 收集所有节点和链接
  // =================================================================
  const moduleIds = Array.from(pluginContext.getModuleIds())
  for (const id of moduleIds) {
    const moduleInfo = pluginContext.getModuleInfo(id)

    if (!moduleInfo)
      continue

    // 创建或更新当前模块的节点 (Source Node)
    if (!nodeMap.has(id)) {
      const { fileName: name, name: label } = parseModuleId(id)
      const [area, matcheRes] = restrictAreaSearcher(id)
      if (typeof matcheRes === 'string') {
        nodeMap.set(id, execOnSet({
          id,
          name,
          label,
          type: 'asset',
          resourceType: matcheRes,
          area,
        } as T))
      }
      else {
        nodeMap.set(id, execOnSet({
          id,
          name,
          label,
          type: 'chunk',
          isEntry: moduleInfo.isEntry,
          area,
        } as T))
      }
    }

    // 处理静态依赖 (Static Imports)
    for (const targetId of moduleInfo.importedIds) {
      // 确保目标节点也存在于 nodeMap 中
      if (!nodeMap.has(targetId)) {
        // 如果目标节点不存在，创建一个基础表示
        const { fileName: name, name: label } = parseModuleId(targetId)
        const targetModuleInfo = pluginContext.getModuleInfo(targetId)
        const [area, matcheRes] = restrictAreaSearcher(targetId)
        if (typeof matcheRes === 'string') {
          nodeMap.set(targetId, execOnSet({
            id: targetId,
            name,
            label,
            type: 'asset',
            resourceType: matcheRes,
            area,
          } as T))
        }
        else {
          nodeMap.set(targetId, execOnSet({
            id: targetId,
            name,
            label,
            type: 'chunk',
            isEntry: targetModuleInfo?.isEntry ?? false,
            area,
          } as T))
        }
      }

      links.push({
        source: id,
        target: targetId,
        type: 'static',
      })
    }

    // 处理动态依赖 (Dynamic Imports)
    for (const targetId of moduleInfo.dynamicallyImportedIds) {
      if (!nodeMap.has(targetId)) {
        const { fileName: name, name: label } = parseModuleId(targetId)
        const targetModuleInfo = pluginContext.getModuleInfo(targetId)
        const [area, matcheRes] = restrictAreaSearcher(targetId)
        if (typeof matcheRes === 'string') {
          nodeMap.set(targetId, execOnSet({
            id: targetId,
            name,
            label,
            type: 'asset',
            resourceType: matcheRes,
            area,
          } as T))
        }
        else {
          nodeMap.set(targetId, execOnSet({
            id: targetId,
            name,
            label,
            type: 'chunk',
            isEntry: targetModuleInfo?.isEntry ?? false,
            area,
          } as T))
        }
      }

      links.push({
        source: id,
        target: targetId,
        type: 'dynamic',
      })
    }
  }

  // =================================================================
  // 计算每个节点的入度 (in-degree) 作为引用权重
  // =================================================================
  const inDegreeMap = new Map<string, number>()

  // 初始化所有节点的入度为 0
  for (const id of nodeMap.keys()) {
    inDegreeMap.set(id, 0)
  }

  // 遍历所有链接，为目标节点 (target) 的入度计数
  for (const link of links) {
    const currentCount = inDegreeMap.get(link.target) ?? 0
    inDegreeMap.set(link.target, currentCount + 1)
  }

  // 更新 nodeMap 中每个节点的 value
  for (const [id, node] of nodeMap.entries()) {
    node.value = inDegreeMap.get(id) ?? 0
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  }
}
