export type SetRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export type ArrayFormat = 'index' | 'bracket' | 'colon-list-separator' | 'comma' | 'separator' | 'bracket-separator'

export interface Options {
  decode?: boolean
  encode?: boolean
  strict?: boolean
  arrayFormat?: ArrayFormat | 'none'
  arrayFormatSeparator?: string
  types?: Record<string, string>
}

export type ParsedQuery<T = string> = Record<string, T | null | Array<T | null>>

export type ParserForArrayFormat<T = any> = (key: string, value: string | undefined | null, accumulator: T) => void
