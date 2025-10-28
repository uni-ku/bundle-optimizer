/**
 * 转义正则特殊字符
 */
export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 创建匹配前缀的正则表达式
 * @param {string} prefix - 要匹配的前缀字符串
 * @param {string} flags - 正则标志，默认为 ''（不设置全局匹配，通常用于单个前缀匹配）
 * @returns {RegExp} 构建好的正则表达式
 */
export function createPrefixRegex(prefix: string, flags: string = ''): RegExp {
  // 对特殊字符进行转义
  const escapedPrefix = escapeRegExp(prefix)
  // 使用 '^' 锚定开头，确保匹配的是前缀
  return new RegExp(`^${escapedPrefix}`, flags)
}

/**
 * 创建匹配开头或结尾字符的正则表达式
 * @param {string} char - 要匹配的特定字符（可选，默认匹配任意字符）
 * @param {string} flags - 正则标志，默认为 'g'
 * @returns {RegExp} 构建好的正则表达式
 */
export function createEdgeRegex(char: string = '.', flags: string = 'g'): RegExp {
  // 对特殊字符进行转义
  const escapedChar = escapeRegExp(char)
  return new RegExp(`^${escapedChar}|${escapedChar}$`, flags)
}
