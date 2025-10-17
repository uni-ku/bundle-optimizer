import { createEdgeRegex } from '..'

interface FileSystemNode {
  id: string
  name: string
  isDir: boolean
  children?: FileSystemNode[]
  /** 权重值 */
  value?: number
}

interface FlattenedFileSystemNode extends FileSystemNode {
  /** 经过扁平化处理后，当前节点下第一层级的子节点ID列表 */
  basePath?: string[]
}

/**
 * 将一个文件系统节点（及其子树）进行单层目录合并
 * @description 这是一个可重用的函数，可以对树中的任何节点调用
 * @param node 要进行扁平化处理的节点
 * @param pathSeparator 路径分隔符，默认为'/'
 * @returns 返回一个新的扁平化后的节点，并包含一个 `basePath` 属性
 */
export function flattenNode(node: FileSystemNode, pathSeparator: string = '/'): FlattenedFileSystemNode {
  // 如果不是目录或没有子节点，则无需处理，直接返回。
  // basePath 为空，因为它没有子节点。
  if (!node.isDir || !node.children || node.children.length === 0) {
    return { ...node }
  }

  // 递归处理所有子节点 (后序遍历)
  // 确保所有子树都已经被扁平化处理
  const flattenedChildren = node.children.map(child => flattenNode(child, pathSeparator))

  // 对当前节点应用合并逻辑
  // 使用处理过的子节点来更新当前节点
  let resultNode: FileSystemNode = {
    ...node,
    children: flattenedChildren,
  }

  // 循环合并：只要当前节点仍然是只有一个子目录的目录，就继续合并
  while (resultNode.children?.length === 1 && resultNode.children[0].isDir) {
    const singleChild = resultNode.children[0]

    // 合并名称和ID，并直接继承孙子节点
    resultNode = {
      ...resultNode,
      name: `${resultNode.name}${pathSeparator}${singleChild.name}`,
      id: singleChild.id, // ID 更新为最深的子节点的ID
      children: singleChild.children,
    }
  }

  // 计算 basePath
  // basePath 的定义是：当前扁平化操作完成后，该节点下第一层子节点的 ID 列表。
  const basePath = resultNode.children?.map(child => child.id) ?? []

  return {
    ...resultNode,
    basePath,
  }
}

/**
 * 将文件路径列表转换为树形的文件系统数据结构，可选择合并单层目录
 * @param paths 路径字符串数组
 * @param flattenSingleDir 是否合并只有一个子文件夹的目录（默认为 true）
 * @returns 根节点对象
 */
export function buildFileSystemTree(paths: string[], flattenSingleDir: boolean = true): FileSystemNode | FlattenedFileSystemNode {
  const separator = '/'
  const root: FileSystemNode = {
    id: separator,
    name: separator,
    isDir: true,
    children: [],
  }

  for (const p of paths) {
    // 统一处理路径，移除开头和结尾的斜杠
    // const parts = p.startsWith(separator) ? p.substring(1).split(separator) : p.split(separator);
    const parts = p.replace(createEdgeRegex(separator), '').split(separator)

    const isSeparatorPrefixed = p.startsWith(separator)
    let currentNode = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      // 需要兼容虚拟路径的情况，类似 `uniPage://`、`uniComponent://`，所以取消以下操作
      // if (!name) continue; // 忽略像 "a//b" 这样的空部分

      let foundNode = currentNode.children?.find(node => node.name === name)

      if (!foundNode) {
        // 归还原本就是以 separator 为前缀的路径
        const id = (isSeparatorPrefixed ? separator : '') + parts.slice(0, i + 1).join(separator)
        const isDir = i < parts.length - 1
        const children = isDir ? [] : undefined

        foundNode = { id, name, isDir, children }

        // 保证文件夹在前，文件在后
        if (isDir) {
          const lastDirIndex = currentNode.children?.map(n => n.isDir).lastIndexOf(true) ?? -1
          currentNode.children?.splice(lastDirIndex + 1, 0, foundNode)
        }
        else {
          currentNode.children?.push(foundNode)
        }
      }
      currentNode = foundNode
    }
  }

  // 扁平化
  if (flattenSingleDir) {
    return flattenNode(root, separator)
  }

  return root
}
