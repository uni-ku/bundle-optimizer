import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

type JsonObject = Record<string, any>

interface UniPage {
  path: string
  style?: JsonObject
  [key: string]: any
}

interface UniSubPackage {
  root: string
  pages?: UniPage[]
  independent?: boolean
  [key: string]: any
}

interface UniPagesJson {
  pages?: UniPage[]
  subPackages?: UniSubPackage[]
  subpackages?: UniSubPackage[]
  [key: string]: any
}

interface ParseMiniProgramPagesJsonOptions {
  subpackages?: boolean
}

interface MiniProgramAppJson {
  pages: string[]
  subPackages?: Array<Omit<UniSubPackage, 'pages'> & { pages: string[] }>
}

const manifestJsonCache = new Map<string, JsonObject>()

/**
 * 是否为普通编译目标
 * - 目前有特殊编译目标 uni_modules 和 ext-api
 */
function isNormalCompileTarget() {
  return !process.env.UNI_COMPILE_TARGET
}

export function parseManifestJson(inputDir: string): JsonObject {
  const filename = path.join(inputDir, 'manifest.json')

  if (!fs.existsSync(filename)) {
    // 特殊编译目标可能没有完整项目配置，缺失 manifest 时按空配置处理
    if (!isNormalCompileTarget())
      return {}

    throw new Error(`[bundle-optimizer] manifest.json not found: ${filename}`)
  }

  // manifest.json 仅按 JSONC 解析，条件注释在这里不参与平台裁剪
  return parseJsonLike(fs.readFileSync(filename, 'utf8'), filename)
}

export function parseManifestJsonOnce(inputDir: string): JsonObject {
  const cached = manifestJsonCache.get(inputDir)
  if (cached)
    return cached

  const manifestJson = parseManifestJson(inputDir)
  manifestJsonCache.set(inputDir, manifestJson)
  return manifestJson
}

export function parseMiniProgramPagesJson(
  jsonStr: string,
  platform: string,
  options: ParseMiniProgramPagesJsonOptions = {},
): { appJson: MiniProgramAppJson, pageJsons: Record<string, JsonObject>, nvuePages: string[] } {
  // pages.json 支持条件编译，解析前需要先按平台裁剪
  const pagesJson = parseJsonLike<UniPagesJson>(jsonStr, 'pages.json', {
    platform,
    preprocess: true,
  })
  validatePagesJson(pagesJson)

  const appJson: MiniProgramAppJson = {
    pages: pagesJson.pages!.map(page => page.path),
  }

  const subPackages = pagesJson.subPackages || pagesJson.subpackages
  if (Array.isArray(subPackages)) {
    if (options.subpackages) {
      appJson.subPackages = subPackages.map(({ root, pages = [], ...rest }) => {
        return {
          root,
          pages: pages.map(page => page.path),
          ...rest,
        }
      })
    }
    else {
      subPackages.forEach(({ root, pages = [] }) => {
        pages.forEach((page) => {
          appJson.pages.push(normalizePath(path.join(root, page.path)))
        })
      })
    }
  }

  return {
    appJson,
    pageJsons: {},
    nvuePages: [],
  }
}

function validatePagesJson(pagesJson: UniPagesJson) {
  if (!Array.isArray(pagesJson.pages))
    throw new Error('[bundle-optimizer] pages.json->pages parse failed.')

  if (!pagesJson.pages.length)
    throw new Error('[bundle-optimizer] pages.json->pages must contain at least 1 page.')

  const pages = new Set<string>()
  for (const page of pagesJson.pages) {
    if (!page?.path)
      throw new Error('[bundle-optimizer] pages.json->pages item must contain path.')

    if (pages.has(page.path))
      throw new Error(`[bundle-optimizer] pages.json->${page.path} duplication.`)

    pages.add(page.path)
  }
}

function parseJsonLike<T = JsonObject>(
  jsonStr: string,
  filename: string,
  { platform = process.env.UNI_PLATFORM, preprocess = false }: { platform?: string, preprocess?: boolean } = {},
): T {
  // 先去除注释，再去除尾随逗号，最后进行 JSON.parse
  const content = stripTrailingCommas(stripJsonComments(preprocess ? preprocessConditionalJson(jsonStr, platform) : jsonStr))

  try {
    return JSON.parse(content) as T
  }
  catch (error) {
    throw new Error(`[bundle-optimizer] ${filename} parse failed: ${(error as Error).message}`)
  }
}

/**
 * json 文本平台条件编译预处理
 * - 支持条件编译指令 #if、#ifdef、#ifndef、#else、#endif
 * @param jsonStr
 * @param platform 平台标识，默认为环境变量 UNI_PLATFORM
 * @returns 预处理后的 json 文本
 * @see https://uniapp.dcloud.net.cn/tutorial/platform.html
 */
function preprocessConditionalJson(jsonStr: string, platform = process.env.UNI_PLATFORM) {
  const context = createConditionalContext(platform)
  const stack: Array<{ parentActive: boolean, matched: boolean, active: boolean }> = []
  const lines = jsonStr.split(/\r?\n/)

  return lines.map((line) => {
    const directive = parseDirective(line)
    if (!directive)
      return isActive(stack) ? line : ''

    const parentActive = stack.length ? stack[stack.length - 1].active : true
    const { name, expression } = directive

    if (name === 'ifdef' || name === 'if') {
      const matched = evaluateCondition(expression, context)
      stack.push({ parentActive, matched, active: parentActive && matched })
    }
    else if (name === 'ifndef') {
      const matched = !evaluateCondition(expression, context)
      stack.push({ parentActive, matched, active: parentActive && matched })
    }
    else if (name === 'else') {
      const current = stack[stack.length - 1]
      if (current) {
        current.active = current.parentActive && !current.matched
        current.matched = true
      }
    }
    else if (name === 'endif') {
      stack.pop()
    }

    return ''
  }).join('\n')
}

function parseDirective(line: string) {
  const trimmed = line.trim()
  const content = trimmed.startsWith('//')
    ? trimmed.slice(2).trim()
    : trimmed.startsWith('/*') && trimmed.endsWith('*/')
      ? trimmed.slice(2, -2).trim()
      : ''

  if (!content.startsWith('#'))
    return

  const directiveContent = content.slice(1).trim()
  const spaceIndex = directiveContent.search(/\s/)
  const name = spaceIndex === -1 ? directiveContent : directiveContent.slice(0, spaceIndex)
  const expression = spaceIndex === -1 ? '' : directiveContent.slice(spaceIndex).trim()

  // uni 条件编译不识别 #elif，这里保留为普通内容处理
  if (!['ifdef', 'ifndef', 'if', 'else', 'endif'].includes(name))
    return

  return {
    name,
    expression,
  }
}

function isActive(stack: Array<{ active: boolean }>) {
  return stack.every(item => item.active)
}

/**
 * 根据平台标识创建条件编译上下文
 * @param platform
 */
function createConditionalContext(platform = '') {
  const normalizedPlatform = normalizeConditionKey(platform)
  const context = new Set<string>(['VUE3'])

  if (normalizedPlatform)
    context.add(normalizedPlatform)

  if (normalizedPlatform.startsWith('MP_'))
    context.add('MP')

  if (normalizedPlatform === 'APP' || normalizedPlatform === 'APP_PLUS') {
    context.add('APP')
    context.add('APP_PLUS')
  }

  if (normalizedPlatform === 'APP_HARMONY') {
    context.add('APP')
    context.add('APP_HARMONY')
  }

  if (normalizedPlatform === 'H5' || normalizedPlatform === 'WEB') {
    context.add('H5')
    context.add('WEB')
  }

  if (normalizedPlatform.startsWith('QUICKAPP'))
    context.add('QUICKAPP')

  return context
}

/**
 * 评估条件表达式
 * - 支持逻辑与 &&、逻辑或 ||、逻辑非 !、括号 ()，以及平台标识符
 * @param expression 条件表达式字符串
 * @param context 条件编译上下文，包含当前平台和相关标识符
 */
function evaluateCondition(expression: string, context: Set<string>) {
  const tokens = expression.match(/[()!]|\|\||&&|[\w-]+/g) || []
  let index = 0

  function peek() {
    return tokens[index]
  }

  function consume() {
    return tokens[index++]
  }

  function parseOr(): boolean {
    let value = parseAnd()
    while (peek() === '||') {
      consume()
      value = parseAnd() || value
    }
    return value
  }

  function parseAnd(): boolean {
    let value = parseUnary()
    while (peek() === '&&') {
      consume()
      value = parseUnary() && value
    }
    return value
  }

  function parseUnary(): boolean {
    if (peek() === '!') {
      consume()
      return !parseUnary()
    }

    if (peek() === '(') {
      consume()
      const value = parseOr()
      if (peek() === ')')
        consume()
      return value
    }

    const token = consume()
    return token ? context.has(normalizeConditionKey(token)) : false
  }

  return parseOr()
}

function normalizeConditionKey(name: string) {
  // 条件表达式里的平台名使用下划线形式进行匹配
  return name.replace(/-/g, '_').toUpperCase()
}

/**
 * 去除 JSON 字符串中的注释
 */
function stripJsonComments(source: string) {
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const next = source[i + 1]

    if (inString) {
      result += char
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '"')
        inString = false
      continue
    }

    if (char === '"') {
      inString = true
      result += char
      continue
    }

    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n')
        i++
      result += '\n'
      continue
    }

    if (char === '/' && next === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        result += source[i] === '\n' ? '\n' : ' '
        i++
      }
      i++
      continue
    }

    result += char
  }

  return result
}

/**
 * 去除 JSON 字符串中的尾随逗号
 * @description jsonc 允许对象和数组中存在尾随逗号，但 JSON.parse 不支持，因此需要预处理去除
 */
function stripTrailingCommas(source: string) {
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (inString) {
      result += char
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '"')
        inString = false
      continue
    }

    if (char === '"') {
      inString = true
      result += char
      continue
    }

    if (char === ',') {
      let nextIndex = i + 1
      while (/\s/.test(source[nextIndex] || ''))
        nextIndex++

      if (source[nextIndex] === '}' || source[nextIndex] === ']')
        continue
    }

    result += char
  }

  return result
}

function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, '/')
}
