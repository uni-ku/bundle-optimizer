import type {
  CallExpression,
  Node,
  Statement,
} from '@babel/types'
import { isCallOf } from 'ast-kit'

export function filterMacro(stmts: (Statement | Node)[] = [], macro: string): CallExpression[] {
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
