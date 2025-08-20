import type { Options } from './types'
import decodeComponent from '../decode-uri-component'

export function strictUriEncode(str: string) {
  return encodeURIComponent(str).replaceAll(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`)
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

export function isSingleChar(char: string): char is string & { length: 1 } {
  return char.length === 1
}

export function encode(value: string, options: Options = {}) {
  if (options.encode) {
    return options.strict ? strictUriEncode(value) : encodeURIComponent(value)
  }

  return value
}

export function decode(value: string, options: Options = {}) {
  if (options.decode) {
    return decodeComponent(value)
  }

  return value
}
