import type {
  CallExpression,
  Node,
  ObjectExpression,
  Statement,
} from '@babel/types'
import { isCallOf } from 'ast-kit'
import { serializeObjectExpression } from '../ast'

export const DEFINE_OPTIONS = 'defineOptions'
export const COMPONENT_PLACEHOLDER = 'componentPlaceholder'

export function filterMacro(stmts: (Statement | Node)[] = [], macro = DEFINE_OPTIONS): CallExpression[] {
  return stmts
    .map((raw: Node) => {
      if (!raw)
        return undefined
      let node = raw
      if (raw.type === 'ExpressionStatement')
        node = raw.expression
      else if (raw.type === 'ExportDefaultDeclaration')
        node = raw.declaration
      return isCallOf(node!, macro) ? node : undefined
    })
    .filter((node): node is CallExpression => !!node)
}

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
