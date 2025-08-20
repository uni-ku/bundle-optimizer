/**
 * Splits a string into two parts based on the first occurrence of a separator.
 * @param str The input string to split.
 * @param separator The separator to use for splitting the string.
 * @returns An array containing the two parts of the split string.
 *
 * @link https://github.com/sindresorhus/split-on-first
 */
export function splitOnFirst(str: string, separator: string | RegExp): [] | [null, null] | [string, string] {
  if (!(typeof str === 'string' && (typeof separator === 'string' || separator instanceof RegExp))) {
    throw new TypeError('Expected the arguments to be of type `string` and `RegExp`')
  }

  if (str === '' || separator === '') {
    return []
  }

  let separatorIndex = -1
  let matchLength = 1

  if (typeof separator === 'string') {
    separatorIndex = str.indexOf(separator)
    matchLength = separator.length
  }
  // https://github.com/sindresorhus/split-on-first/issues/12
  else if (separator instanceof RegExp) {
    // ignore `g` flag
    const nonGlobalRegex = new RegExp(separator.source, separator.flags.replace('g', ''))
    const match = nonGlobalRegex.exec(str)
    if (match) {
      separatorIndex = match.index
      matchLength = match[0].length
    }
  }

  if (separatorIndex === -1) {
    return []
  }

  return [
    str.slice(0, separatorIndex),
    str.slice(separatorIndex + matchLength),
  ]
}

export default splitOnFirst
