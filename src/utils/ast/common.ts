import type {
  CallExpression,
  ExportDefaultDeclaration,
  Node,
  ObjectExpression,
  Program,
  TemplateLiteral,
} from '@babel/types'
import { walkAST } from 'ast-kit'

export function getDefaultExports(program: Program) {
  const defaultExports: ExportDefaultDeclaration[] = []

  walkAST(program, {
    enter(node) {
      // 匹配 export default
      // 虽然标准语法中只支持一个默认导出，但是这里支持多个默认导出节点的收集
      if (node.type === 'ExportDefaultDeclaration') {
        defaultExports.push(node)
      }
      // export 只能出现在顶层，遇到块级作用域直接跳过
      if (node.type === 'BlockStatement' || node.type === 'FunctionDeclaration') {
        this.skip()
      }
    },
  })

  return defaultExports
}

export function getDynamicImports(program: Program) {
  const imports: Array<{
    path: unknown
    node: CallExpression
    isStatic: boolean
  }> = []

  walkAST(program, {
    enter(node) {
      // 识别动态 import 语法： import(...)
      // 在 Babel AST 中表现为 CallExpression，且 callee 类型为 Import
      if (node.type === 'CallExpression' && node.callee.type === 'Import') {
        const firstArg = node.arguments[0]

        // 利用 parseValue 进行静态求值
        // 这意味着 import('path/' + 'to/file') 这种拼接也能被解析出来
        const value = parseValue(firstArg)
        // 收集结果
        imports.push({
          path: value,
          node,
          // 如果解析出的是字符串，说明是纯静态路径；如果是 [Identifier: x] 说明依赖变量
          isStatic: typeof value === 'string' && !String(value).includes('[Identifier:'),
        })
      }
    },
  })
  return imports
}

export function serializeObjectExpression(node: ObjectExpression) {
  // 确保传入的是对象表达式
  if (node.type !== 'ObjectExpression') {
    throw new Error('Not an ObjectExpression')
  }

  const result: Record<string, unknown> = {}

  node.properties.forEach((prop) => {
    // 处理常见的属性（Property），排除 SpreadElement（如 ...obj）
    if (prop.type === 'ObjectProperty') {
      let key

      // 处理 key (例如 { a: 1 } 或 { "a": 1 })
      if (prop.computed) {
        // 如果是计算属性 [key]: value，简单静态处理可能拿不到值，这里通常抛错或跳过
        console.warn('Computed properties are not supported in static serialization')
        return
      }
      else {
        // 处理 Identifier (a) 或 StringLiteral ("a")
        // @ts-expect-error ignore
        key = prop.key.name || prop.key.value
      }

      // 处理 value (递归解析)
      // 如果存在相同 key，则将会记录到最后一项
      result[key] = parseValue(prop.value)
    }
  })

  return result
}

export function parseValue(node?: Node | null): unknown {
  if (!node)
    return node

  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'BigIntLiteral':
      return BigInt(node.value)
    case 'RegExpLiteral':
      return new RegExp(node.pattern, node.flags)
    case 'ObjectExpression':
      return serializeObjectExpression(node)
    case 'ArrayExpression':
      return node.elements.map((el) => {
        return el ? parseValue(el) : null
      })
    case 'BinaryExpression': {
      const left = parseValue(node.left)
      const right = parseValue(node.right)

      // 如果左右任一端无法静态解析（例如引用了变量），则整体返回 undefined 或占位符
      if ((typeof left === 'string' && left.startsWith('[')) || (typeof right === 'string' && right.startsWith('['))) {
        return `[BinaryExpression: ${node.operator}]`
      }

      switch (node.operator) {
        case '+': return (left as any) + (right as any)
        case '-': return (left as any) - (right as any)
        case '*': return (left as any) * (right as any)
        case '/': return (left as any) / (right as any)
        case '%': return (left as any) % (right as any)
        case '**': return (left as any) ** (right as any)
          // eslint-disable-next-line eqeqeq
        case '==': return left == right
        case '===': return left === right
          // eslint-disable-next-line eqeqeq
        case '!=': return left != right
        case '!==': return left !== right
        case '>': return (left as any) > (right as any)
        case '<': return (left as any) < (right as any)
        default: return `[Unsupported Operator: ${node.operator}]`
      }
    }
    // 逻辑表达式
    case 'LogicalExpression': {
      const left = parseValue(node.left)
      // 模拟 JS 的短路逻辑
      if (node.operator === '&&')
        return left && parseValue(node.right)
      if (node.operator === '||')
        return left || parseValue(node.right)
      if (node.operator === '??')
        return left ?? parseValue(node.right)
      return undefined
    }
    case 'TemplateLiteral':
      // 如果是没有变量的模板字符串
      return parseTemplateLiteral(node)
    case 'UnaryExpression': {
      const { operator, argument } = node
      const value = parseValue(argument) // 递归获取参数值

      // 如果参数无法解析出静态值，则整体无法解析
      if (value === undefined)
        return undefined

      switch (operator) {
        case '-': return -(value as any)
        case '+': return +(value as any)
        case '!': return !value
        case '~': return ~(value as any)
        case 'void': return undefined
        default: return `[${operator}: ${value}]` // 其余如 typeof, delete 无法静态化
      }
    }
    case 'Identifier':
      // 如果遇到变量引用，静态环境下无法得知具体值，通常返回变量名字符串或占位符
      return `[Identifier: ${node.name}]`
    default:
      return `[Unhandled: ${node.type}]`
  }
}

/**
 * 模版字符串 ast 转成文本
 * @param node TemplateLiteral
 */
export function parseTemplateLiteral(node: TemplateLiteral) {
  let result = ''
  const quasis = node.quasis
  const expressions = node.expressions

  for (let i = 0; i < quasis.length; i++) {
    result += quasis[i].value.cooked

    if (i < expressions.length) {
      // result += `\${${expressions[i].type}}`
      const expr = expressions[i]
      // 尝试递归解析值
      const value = parseValue(expr)

      // 如果解析出了具体值（比如常量），直接拼进去
      if (typeof value === 'string' || typeof value === 'number') {
        result += value
      }
      else {
        // 如果无法解析（是变量），则保留占位符，或者尝试读取变量名
        // @ts-expect-error type guard
        const name = expr.name || `\${${expr.type}}`
        result += `[${name}]`
      }
    }
  }
  return result
}
