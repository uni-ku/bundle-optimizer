/* eslint-disable unused-imports/no-unused-vars */
import type { OutputChunk } from 'rollup'
import type { Plugin } from 'vite'
import type { DtsType } from '../type.d'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import MagicString from 'magic-string'
import { AsyncImports } from '../common/AsyncImports'
import { JS_TYPES_RE, ROOT_DIR, SRC_DIR_RE } from '../constants'
import { ensureDirectoryExists, lexFunctionCalls, moduleIdProcessor, normalizePath, parseAsyncImports, resolveAliasPath, resolveAssetsPath } from '../utils'

/**
 * 负责处理`AsyncImport`函数调用的传参路径
 *
 * @description `transform`阶段处理`AsyncImport()`函数的路径传参，将别名路径转换为真实路径
 * @description `generateBundle`阶段处理`AsyncImport()`函数的路径传参，进一步将路径转换为生产环境的路径（hash化的路径）
 *
 * TODO: 暂时不支持app端：首先由于app端实用的是iife模式，代码内容中无法使用`import()`语法，直接会编译报错
 */
export function AsyncImportProcessor(options: DtsType): Plugin {
  const platform = process.env.UNI_PLATFORM
  /** 是否小程序 */
  const isMP = platform?.startsWith('mp')
  /** 是否H5 */
  const isH5 = platform === 'h5'
  /** 是否为app */
  const isApp = platform === 'app'
  const AsyncImportsInstance = new AsyncImports()

  /** 生成类型定义文件 */
  function generateTypeFile(paths?: string[]) {
    if (options === false || options.enable === false)
      return

    const typesFilePath = path.resolve(ROOT_DIR, normalizePath(options.path))
    ensureDirectoryExists(typesFilePath)
    let cache: string[] = [] // 缓存已经生成的类型定义，防止开发阶段热更新时部分类型定义生成丢失
    if (fs.existsSync(typesFilePath)) {
      const list = lexFunctionCalls(fs.readFileSync(typesFilePath, 'utf-8'), 'import').flatMap(({ args }) => args.map(({ value }) => value.toString()))
      list && list.length && (cache = Array.from(new Set(list)))
    }
    const typeDefinition = generateModuleDeclaration(paths, cache)
    fs.writeFileSync(typesFilePath, typeDefinition)
  }
  generateTypeFile() // 初始化类型定义文件

  return {
    name: 'async-import-processor',
    enforce: 'post', // 插件执行时机，在其他处理后执行

    transform(code, id) {
      const asyncImports = parseAsyncImports(code)

      const magicString = new MagicString(code)

      if (asyncImports.length > 0 && !isApp) {
        // 生成类型定义文件
        const paths = asyncImports.map(item => item.args[0].value.toString())
        generateTypeFile(paths)

        asyncImports.forEach(({ full, args }) => {
          args.forEach(({ start, end, value }) => {
            // 加入缓存
            AsyncImportsInstance.addCache(moduleIdProcessor(id), value.toString())
            magicString.overwrite(full.start, full.start + 'AsyncImport'.length, 'import', { contentOnly: true })
          })
        })
      }

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true }),
      }
    },
    renderDynamicImport(options) {
      const cache = AsyncImportsInstance.getCache(moduleIdProcessor(options.moduleId))
      if (cache && options.targetModuleId && !isApp && !isH5) {
        // 如果是js文件的话去掉后缀
        const targetModuleId = moduleIdProcessor(options.targetModuleId).replace(JS_TYPES_RE, '')
        if (cache.map(item => resolveAliasPath(item, true).replace(SRC_DIR_RE, 'src/'))
          .some(item => moduleIdProcessor(item).replace(JS_TYPES_RE, '') === targetModuleId)
        ) {
          return {
            left: 'AsyncImport(',
            right: ')',
          }
        }
      }
    },
    generateBundle({ format }, bundle) {
      // 小程序端为cjs，app端为iife
      if (!['es', 'cjs', 'iife'].includes(format) || isApp)
        return

      // 页面被当作组件引入了，这是允许的，但是表现不一样，此处缓存记录
      const pageComponents: OutputChunk[] = []

      const hashFileMap = Object.entries(bundle).reduce((acc, [file, chunk]) => {
        if (chunk.type === 'chunk') {
          let moduleId = chunk.facadeModuleId ?? undefined

          if (moduleId?.startsWith('uniPage://') || moduleId?.startsWith('uniComponent://')) {
            const moduleIds = chunk.moduleIds.filter(id => id !== moduleId).map(id => moduleIdProcessor(id))
            if (moduleIds.length >= 1 && moduleIds.length < chunk.moduleIds.length) {
              moduleId = moduleIds.at(-1)
            }
            else if (!moduleIds.length && chunk.fileName) { // 处理页面被当作组件引入的情况
              pageComponents.push(chunk)
              return acc
            }
          }

          if (moduleId) {
            acc[moduleIdProcessor(moduleId)] = chunk.fileName
          }
          else {
            // 处理其他的文件的hash化路径映射情况
            const temp = chunk.moduleIds.filter((id) => {
              const _id = id.startsWith('\x00') ? id.slice(1) : id
              return _id !== 'plugin-vue:export-helper'
            })
            if (temp.length === 1) {
              acc[moduleIdProcessor(temp[0])] = chunk.fileName
            }
          }
        }

        return acc
      }, {} as Record<string, string | string[]>)

      if (pageComponents.length) {
        const chunks = Object.values(bundle)
        for (let index = 0; index < chunks.length; index++) {
          const chunk = chunks[index]
          if (chunk.type === 'chunk') {
            const targetKey = Object.keys(hashFileMap).find((key) => {
              const value = hashFileMap[key]
              return typeof value === 'string' ? chunk.imports.includes(value) : value.some((item: string) => chunk.imports.includes(item))
            })
            if (targetKey) {
              const old = typeof hashFileMap[targetKey] === 'string' ? [hashFileMap[targetKey]] : hashFileMap[targetKey] || []
              hashFileMap[targetKey] = [...old, chunk.fileName]
            }
          }
        }
      }

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'chunk' && chunk.code.includes('AsyncImport')) {
          const code = chunk.code
          const asyncImports = parseAsyncImports(code)

          if (asyncImports.length > 0) {
            const magicString = new MagicString(code)

            asyncImports.forEach(({ full, args }) => {
              args.forEach(({ start, end, value }) => {
                const url = value.toString()

                // 去除相对路径的前缀，例如`./`、`../`、`../../`等正确的相对路径的写法，`.../`是不正确的
                if (
                  isMP
                    ? Object.values(hashFileMap).flat().includes(url.replace(/^(\.\/|\.\.\/)+/, ''))
                    : Object.values(hashFileMap).flat().map(resolveAssetsPath).includes(url)
                ) {
                  magicString.overwrite(full.start, full.start + 'AsyncImport'.length, isMP ? 'require.async' : 'import', { contentOnly: true })
                }
              })
            })
            // 遍历完毕之后更新chunk的code
            chunk.code = magicString.toString()
          }
        }
      }
    },
  }
}

/**
 * 生成类型定义
 */
function generateModuleDeclaration(paths?: string[], cache?: string[]): string {
  // 将路径组合成 ModuleMap 中的键
  const moduleMapEntries = Array.from(new Set([...(cache || []), ...(paths || [])]))
    ?.map((p) => {
      return `  '${p}': typeof import('${p}')`
    })
    .join('\n')

  // 返回类型定义
  return `/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by @uni-ku/bundle-optimizer
export {}

interface ModuleMap {
${moduleMapEntries
    ? `${moduleMapEntries}
  [path: string]: any`
    : '  [path: string]: any'
}
}

declare global {
  function AsyncImport<T extends keyof ModuleMap>(arg: T): Promise<ModuleMap[T]>
}
`
}
