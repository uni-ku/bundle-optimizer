export interface IOptimizationOptions {
  mode: 'development' | 'production'
  command: 'serve' | 'build'
}

export interface ISubPkgsInfo {
  root: string
  independent: boolean
}
