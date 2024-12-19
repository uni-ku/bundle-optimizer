/* eslint-disable ts/no-unsafe-function-type */

import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import MagicString from 'magic-string'
import { minimatch } from 'minimatch'
import { ROOT_DIR } from '../constants'
import { ensureDirectoryExists, normalizeFunctionSyntax } from '../utils'

/**
 * 全局方法注入
 *
 * @description 通过`globalThis`对象注册全局方法，支持生成类型文件
 */
export function GlobalMethodPlugin(options: GlobalMethodOptions): Plugin {
  const {
    methods,
    include = [],
    exclude = [],
    rootDir = ROOT_DIR,
    generateTypes = true, // 默认为生成类型文件
    typesFilePath = path.resolve(ROOT_DIR, 'global-method.d.ts'), // 默认为 global-method.d.ts
  } = options

  // 文件匹配函数
  const filter = (id: string) => {
    const relativePath = path.relative(rootDir, id).replace(/\\/g, '/')
    const isIncluded = include.length === 0 || include.some(pattern => minimatch(relativePath, pattern))
    const isExcluded = exclude.length > 0 && exclude.some(pattern => minimatch(relativePath, pattern))
    return isIncluded && !isExcluded
  }

  // 生成批量注册方法的代码
  const globalMethodsCode = `
if (typeof globalThis._globalMethods === 'undefined') {
  globalThis._globalMethods = {};
  ${Object.entries(methods).map(([methodName, methodBody]) => {
    const targetMethodBody = Array.isArray(methodBody) ? methodBody[0] : methodBody

    const methodCode = typeof targetMethodBody === 'string'
      ? `function() { ${targetMethodBody} }`
      : typeof targetMethodBody === 'function' ? normalizeFunctionSyntax(targetMethodBody.toString(), true) : ''

    return methodCode && `
  if (typeof globalThis.${methodName} === 'undefined') {
    globalThis.${methodName} = ${methodCode};
  }
  `
  }).join('')}
}
`

  // 生成类型声明的代码
  const generateTypesCode = `export {}

declare global {${Object.entries(methods).map(([methodName, methodBody]) => {
    const methodInterface = Array.isArray(methodBody)
      ? methodBody[1]
      : (typeof methodBody === 'string' || typeof methodBody === 'function') ? {} : methodBody

    return `
  ${generateFunctionType(methodName, methodInterface)}`
  },
  ).join('')
}
}
`

  return {
    name: 'vite-plugin-global-methods',
    enforce: 'post', // 插件执行时机，在其他处理后执行

    transform(code, id) {
      if (!filter(id))
        return null

      const magicString = new MagicString(code)
      magicString.prepend(globalMethodsCode)

      // 如果需要生成类型文件
      if (generateTypes) {
        ensureDirectoryExists(typesFilePath)
        fs.writeFileSync(typesFilePath, generateTypesCode)
      }

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true }),
      }
    },
  }
}

/** 生成函数的ts接口类型 */
function generateFunctionType(funcName: string, { paramsType, returnType }: FunctionInterface = {}) {
  const params = Array.isArray(paramsType) ? paramsType.map((item, index) => `arg${index}: ${item}`).join(', ') : `arg: ${paramsType || 'any'}`
  return `function ${funcName}(${params}): ${returnType || 'any'}`
}

interface FunctionInterface {
  /** 函数入参类型数组 */
  paramsType?: string | string[]
  /** 函数返回值类型 */
  returnType?: string
}

interface GlobalMethodMap {
  [methodName: string]: string | Function
    | [string | Function]
    | [string | Function, FunctionInterface]
    | FunctionInterface // 仅仅生成类型声明
}

export type GlobalMethod = GlobalMethodMap

export interface GlobalMethodOptions {
  methods: GlobalMethod
  include?: string[]
  exclude?: string[]
  rootDir?: string
  /** 是否生成 TS 类型声明 | 默认为 true */
  generateTypes?: boolean
  /** 生成的类型声明文件路径 | 默认项目根目录下`global-method.d.ts` */
  typesFilePath?: string
}
