/** 解析函数的参数，考虑字符串、数字、变量等类型，并返回定位信息 */
export interface ArgumentLocation {
  value: string | number
  start: number
  end: number
}

export interface FullMatchLocation {
  start: number
  end: number
  fullMatch: string
}

export interface FunctionCall {
  full: FullMatchLocation
  args: ArgumentLocation[]
}

/** 解析 `import xxx from 'yyy?query1&query2'` 的导入形式，返回定位信息 */
export interface ImportDefaultWithQuery {
  /** import xxx from 'yyy?query1&query2' */
  full: FullMatchLocation
  /** xxx */
  defaultVariable: ArgumentLocation
  /** yyy */
  modulePath: ArgumentLocation
  /** ?query1&query2 */
  query: ArgumentLocation[]
  /** 完整路径信息 */
  fullPath: ArgumentLocation
}
