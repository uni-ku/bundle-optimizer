export interface IOptimizationOptions {
  mode: 'development' | 'production' | string
  command: 'serve' | 'build'
}

export interface ISubPkgsInfo {
  root: string
  independent: boolean
}
