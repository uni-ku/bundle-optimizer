import type { ManualChunkMeta } from '../../type'
import type { GraphChunkNode, GraphLink, GraphNode } from './type'
import path from 'node:path'

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

/**
 * 将 Rollup/Vite 的模块图数据转换为 ECharts 可用的格式
 * @param pluginContext - Rollup 插件的上下文对象 (`this`)
 * @returns 包含 nodes 和 links 的对象
 */
export function transformDataForECharts(
  pluginContext: ManualChunkMeta,
): { nodes: GraphNode[], links: GraphLink[] } {
  const nodeMap = new Map<string, GraphNode>()
  const links: GraphLink[] = []

  // =================================================================
  // 收集所有节点和链接
  // =================================================================
  const moduleIds = Array.from(pluginContext.getModuleIds())
  for (const id of moduleIds) {
    const moduleInfo = pluginContext.getModuleInfo(id)

    if (!moduleInfo)
      continue

    // 创建或更新当前模块的节点 (Source Node)
    // 我们假设所有能从 getModuleInfo 获取到的都是 'chunk' 类型
    // TODO: 真正的 'asset' 通常不在此列表中，它们需要在 generateBundle 中处理
    if (!nodeMap.has(id)) {
      const { fileName, ext, name } = parseModuleId(id)

      const node: GraphChunkNode = {
        id,
        fileName,
        name,
        type: 'chunk',
        ext,
        isEntry: moduleInfo.isEntry,
        isExternal: moduleInfo?.isExternal ?? true,
        code: moduleInfo.code,
      }
      nodeMap.set(id, node)
    }

    // 处理静态依赖 (Static Imports)
    for (const targetId of moduleInfo.importedIds) {
      // 确保目标节点也存在于 nodeMap 中
      if (!nodeMap.has(targetId)) {
        // 如果目标节点不存在，创建一个基础表示
        const { fileName, ext, name } = parseModuleId(targetId)
        const targetModuleInfo = pluginContext.getModuleInfo(targetId)
        nodeMap.set(targetId, {
          id: targetId,
          fileName,
          name,
          type: 'chunk',
          ext,
          isEntry: targetModuleInfo?.isEntry ?? false,
          isExternal: targetModuleInfo?.isExternal ?? true,
          code: targetModuleInfo?.code,
        })
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
        const { fileName, ext, name } = parseModuleId(targetId)
        const targetModuleInfo = pluginContext.getModuleInfo(targetId)
        nodeMap.set(targetId, {
          id: targetId,
          fileName,
          name,
          type: 'chunk',
          ext,
          isEntry: targetModuleInfo?.isEntry ?? false,
          isExternal: targetModuleInfo?.isExternal ?? true,
          code: targetModuleInfo?.code,
        })
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
    // 这里需要类型守卫，因为 GraphNode 可能是 Asset
    if (node.type === 'chunk') {
      node.value = inDegreeMap.get(id) ?? 0
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  }
}
