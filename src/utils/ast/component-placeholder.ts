import type { ObjectExpression } from '@babel/types'
import { serializeObjectExpression } from './common'
import { COMPONENT_PLACEHOLDER } from './constant'

export function hasComponentPlaceholder(node: ObjectExpression): boolean {
  return node.properties.some(
    prop =>
      (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod')
      && prop.key.type === 'Identifier'
      && (prop.key.name === COMPONENT_PLACEHOLDER),
  )
}

export function getComponentPlaceholder(node: ObjectExpression) {
  if (node?.type !== 'ObjectExpression') {
    return
  }
  if (!hasComponentPlaceholder(node)) {
    return
  }

  // 序列化 ast 为对象
  const obj = serializeObjectExpression(node)
  if (COMPONENT_PLACEHOLDER in obj && typeof obj[COMPONENT_PLACEHOLDER] === 'object') {
    return obj[COMPONENT_PLACEHOLDER] as typeof obj
  }
}
