import base64url from '../base64url'

export const uniPagePrefix = 'uniPage://' as const
export const uniComponentPrefix = 'uniComponent://' as const

export function virtualPagePath(filepath: string): `${typeof uniPagePrefix}${string}` {
  return `${uniPagePrefix}${base64url.encode(filepath)}`
}

export function virtualComponentPath(filepath: string): `${typeof uniComponentPrefix}${string}` {
  return `${uniComponentPrefix}${base64url.encode(filepath)}`
}

export function parseVirtualPagePath(uniPageUrl: string) {
  return base64url.decode(uniPageUrl.replace(uniPagePrefix, ''))
}

export function parseVirtualComponentPath(uniComponentUrl: string) {
  return base64url.decode(uniComponentUrl.replace(uniComponentPrefix, ''))
}

export function isUniVirtualPagePath(path: string): path is `${typeof uniPagePrefix}${string}` {
  return path.startsWith(uniPagePrefix)
}

export function isUniVirtualComponentPath(path: string): path is `${typeof uniComponentPrefix}${string}` {
  return path.startsWith(uniComponentPrefix)
}

export function isUniVirtualPath(path: string): path is `${typeof uniPagePrefix}${string}` | `${typeof uniComponentPrefix}${string}` {
  return isUniVirtualPagePath(path) || isUniVirtualComponentPath(path)
}

// Old: [boolean, string, 'page' | 'component' | null]
type ParseResult
  = | [true, string, 'page' | 'component']
    | [false, string, null]

export function parseVirtualPath<T extends string>(virtualUrl?: T): ParseResult {
  if (virtualUrl?.startsWith(uniPagePrefix)) {
    return [true, parseVirtualPagePath(virtualUrl), 'page']
  }
  if (virtualUrl?.startsWith(uniComponentPrefix)) {
    return [true, parseVirtualComponentPath(virtualUrl), 'component']
  }
  return [false, virtualUrl ?? '', null]
}
