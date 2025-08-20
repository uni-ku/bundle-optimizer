import type { Options, ParsedQuery, ParserForArrayFormat, SetRequired } from './types'
import splitOnFirst from '../split-on-first'
import { decode, isNil } from './utils'

/**
 *
 * @link https://github.com/sindresorhus/query-string/blob/dc13d74d1350f8a6504b50193b8d3b60078dffaf/base.js#L357
 */
export function parse(query: string, options: Options = {}): ParsedQuery {
  options = {
    decode: true,
    arrayFormat: 'none',
    arrayFormatSeparator: ',',
    types: Object.create(null),
    ...options,
  }

  if (!validateArrayFormatSeparator(options.arrayFormatSeparator)) {
    throw new TypeError('arrayFormatSeparator must be single character string')
  }
  const formatter = parserForArrayFormat(options as SetRequired<Options, 'arrayFormatSeparator'>)

  // Create an object with no prototype
  const returnValue = Object.create(null)

  if (typeof query !== 'string') {
    return returnValue
  }

  // remove the special leading characters
  query = query.trim().replace(/^[?#&]/, '')

  if (!query) {
    return returnValue
  }

  for (const pair of query.split('&')) {
    if (pair === '') {
      continue
    }

    const parameter = options.decode ? pair.replaceAll('+', ' ') : pair

    let [key, value] = splitOnFirst(parameter, '=')

    key ??= parameter

    value = isNil(value)
      ? null
      : decode(value, options)

    formatter(decode(key, options), value, returnValue)
  }

  return returnValue
}

function validateArrayFormatSeparator(value: unknown): value is string & { length: 1 } {
  return typeof value === 'string' && value.length === 1
}

function parserForArrayFormat(options: SetRequired<Options, 'arrayFormatSeparator'>): ParserForArrayFormat {
  let result: RegExpExecArray | null = null

  function canBeArray(value: unknown) {
    return typeof value === 'string' && value.includes(options.arrayFormatSeparator)
  }
  function canBeEncodedArray(value: unknown) {
    return typeof value === 'string' && !canBeArray(value) && decode(value, options).includes(options.arrayFormatSeparator)
  }
  function tryBeArray(value: unknown) {
    return canBeArray(value) || canBeEncodedArray(value)
  }

  switch (options.arrayFormat) {
    case 'index': {
      return (key, value, accumulator) => {
        result = /\[(\d*)\]$/.exec(key)

        key = key.replace(/\[\d*\]$/, '')

        if (!result) {
          accumulator[key] = value
          return
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = {}
        }
        accumulator[key][result[1]] = value
      }
    }

    case 'bracket': {
      return (key, value, accumulator) => {
        result = /(\[\])$/.exec(key)
        key = key.replace(/\[\]$/, '')

        if (!result) {
          accumulator[key] = value
          return
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = [value]
          return
        }

        accumulator[key] = [...accumulator[key], value]
      }
    }

    case 'colon-list-separator': {
      return (key, value, accumulator) => {
        result = /(:list)$/.exec(key)
        key = key.replace(/:list$/, '')

        if (!result) {
          accumulator[key] = value
          return
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = [value]
          return
        }

        accumulator[key] = [...accumulator[key], value]
      }
    }

    case 'comma':
    case 'separator': {
      return (key, value, accumulator) => {
        value = isNil(value) ? value : canBeEncodedArray(value) ? decode(value, options) : value

        const newValue = isNil(value)
          ? value
          : tryBeArray(value)
            ? value.split(options.arrayFormatSeparator).map(item => decode(item, options))
            : decode(value, options)

        accumulator[key] = newValue
      }
    }

    case 'bracket-separator': {
      return (key, value, accumulator) => {
        const isArray = /\[\]$/.test(key)
        key = key.replace(/\[\]$/, '')

        if (!isArray) {
          accumulator[key] = value ? decode(value, options) : value
          return
        }

        const arrayValue = isNil(value)
          ? []
          : decode(value, options).split(options.arrayFormatSeparator)

        if (accumulator[key] === undefined) {
          accumulator[key] = arrayValue
          return
        }

        accumulator[key] = [...accumulator[key], ...arrayValue]
      }
    }

    default: {
      return (key, value, accumulator) => {
        if (accumulator[key] === undefined) {
          accumulator[key] = value
          return
        }

        accumulator[key] = [...[accumulator[key]].flat(), value]
      }
    }
  }
}
