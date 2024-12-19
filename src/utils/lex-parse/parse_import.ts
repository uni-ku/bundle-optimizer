/* eslint-disable no-cond-assign */
import type { ImportDefaultWithQuery } from './type'

export const IMPORT_DEFAULT_WITH_QUERY_RE = /import\s+(\w+)\s+from\s+(['"])([^'"]+)\?(\w+(?:&\w+)*)\2(?:\s*;)?/g
function parseValue(value: string) {
  if ((value.startsWith('\'') && value.endsWith('\'')) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1) // 移除引号
  }
  return value
}

export function lexDefaultImportWithQuery(code: string) {
  const matches: ImportDefaultWithQuery[] = []
  let match: RegExpExecArray | null

  // 逐个匹配函数调用
  while ((match = IMPORT_DEFAULT_WITH_QUERY_RE.exec(code)) !== null) {
    const fullMatchLocation = {
      start: match.index, // 函数调用的起始位置
      end: match.index + match[0].length, // 函数调用的结束位置
      fullMatch: match[0], // 完整匹配的函数调用
    }

    const defaultVariable = {
      value: parseValue(match[1]),
      start: match.index + match[0].indexOf(match[1]),
      end: match.index + match[0].indexOf(match[1]) + match[1].length,
    }

    const modulePath = {
      value: parseValue(match[3]),
      start: match.index + match[0].indexOf(match[3]),
      end: match.index + match[0].indexOf(match[3]) + match[3].length,
    }

    /** 字符的长度加上一个`&`或者`?`的长度 */
    let lastLength = 0
    const query = match[4].split('&').map((queryParam, _index, list) => {
      lastLength += (list[_index - 1]?.length || 0) + 1

      const prevLength = modulePath.end + lastLength
      const start = prevLength + match![0].slice(prevLength - fullMatchLocation.start).indexOf(queryParam)
      const end = start + queryParam.length

      return {
        value: parseValue(queryParam),
        start,
        end,
      }
    })

    const fullPath = {
      value: parseValue(`${match[3]}?${match[4]}`),
      start: modulePath.start,
      end: query[query.length - 1].end,
    }

    matches.push({
      full: fullMatchLocation, // 完整匹配的函数调用
      defaultVariable, // 参数解析结果
      modulePath,
      query,
      fullPath, // 完整路径信息
    })
  }

  return matches
}

// 测试用例
// const code = `
// import type { ParseError as EsModuleLexerParseError, ImportSpecifier } from 'es-module-lexer'
// import type { Plugin } from 'vite';
// import type { IOptimizationOptions } from './type'
// import { init, parse as parseImports } from 'es-module-lexer'
// import MagicString from 'magic-string'
// import { createParseErrorInfo, parseImportDefaultWithQuery } from '../utils'
// import AsyncImport from './async-import?a'
// import UniappSubPackagesOptimization from './main'
// `

// console.log(code.slice(lexDefaultImportWithQuery(code)[0].full.start, lexDefaultImportWithQuery(code)[0].full.end).endsWith('\n'))
