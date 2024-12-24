export interface ISubPkgsInfo {
  root: string
  independent: boolean
}

export interface IPluginOptions {
  /**
   * 生成的类型声明文件路径
   * @default 'async-import.d.ts'
   */
  dts?: {
    /**
     * 生成的类型声明文件路径
     * @default 'async-import.d.ts'
     */
    asyncImport?: string | false
    /**
     * 生成的类型声明文件路径
     * @default 'async-component.d.ts'
     */
    asyncComponent?: string | false
  }
}
