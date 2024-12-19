/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-cond-assign */

import type { ArgumentLocation, FullMatchLocation, FunctionCall } from './type'

export function lexFunctionCalls(code: string, functionName: string) {
  // 正则匹配指定函数名的调用，并提取参数部分
  const functionPattern = new RegExp(
    `\\b${functionName}\\s*\\(\\s*([^\\)]*)\\s*\\)`, // 函数名 + 参数部分
    'g',
  )

  const matches: FunctionCall[] = []
  let match: RegExpExecArray | null

  // 逐个匹配函数调用
  while ((match = functionPattern.exec(code)) !== null) {
    // 提取参数部分
    const argsString = match[1]

    const fullMatchLocation: FullMatchLocation = {
      start: match.index, // 函数调用的起始位置
      end: match.index + match[0].length, // 函数调用的结束位置
      fullMatch: match[0], // 完整匹配的函数调用
    }

    // 计算函数名+括号的结束位置偏移量，用于修正参数的起始位置
    const functionCallPrefixEnd = match.index + match[0].indexOf('(') + 1
    const padStartCount = match[0].indexOf(argsString) - (match[0].indexOf('(') + 1)

    // 解析函数的参数及其定位
    const args = parseArguments(argsString.padStart(argsString.length + padStartCount), functionCallPrefixEnd, code)

    matches.push({
      full: fullMatchLocation, // 完整匹配的函数调用
      args, // 参数解析结果
    })
  }

  return matches
}

function parseArguments(argsString: string, functionPrefixEnd: number, code: string): ArgumentLocation[] {
  const args: ArgumentLocation[] = []

  // 匹配字符串、数字和变量
  const argPattern = /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\d+(?:\.\d+)?|\w+/g //

  let match: RegExpExecArray | null
  while ((match = argPattern.exec(argsString)) !== null) {
    // 获取匹配的参数值
    const argValue = match[0]
    const argStart = functionPrefixEnd + argsString.slice(0, match.index).length // 参数起始位置
    const argEnd = argStart + argValue.length // 参数结束位置

    // 去掉字符串中的引号
    let value: ArgumentLocation['value'] = argValue
    if ((value.startsWith('\'') && value.endsWith('\'')) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1) // 移除引号
    }
    else if (!Number.isNaN(Number(value))) {
      value = Number(value) // 将数字字符串转换为数字
    }

    args.push({
      value, // 只保留实际的参数值
      start: argStart, // 修正后的起始位置
      end: argEnd, // 修正后的结束位置
    })
  }

  return args
}

// // 测试代码
// const code = `
//       AsyncImport('module1');
//       AsyncImport("module2", "module3");
//       AsyncImport('module4', 'module5');
//       AsyncImport('module6', "module7", 'module8');
//       CustomFunction(   'arg1'  ,   123   ,   varName    )   ;
// `

// const asyncImports = lexFunctionCalls(code, "AsyncImport")
// // console.log('AsyncImports:', JSON.stringify(asyncImports, null, 2))

// const customFunctions = lexFunctionCalls(code, "CustomFunction")
// // console.log("CustomFunctions:", JSON.stringify(customFunctions, null, 2))
