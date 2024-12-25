export interface ISubPkgsInfo {
  root: string
  independent: boolean
}

interface IDtsOptions {
  /**
   * 是否开启类型定义文件生成（可选）
   *
   * @description 默认为true，即开启类型定义文件生成
   * @default true
   */
  enable?: boolean
  /**
   * 类型定义文件生成的基础路径（可选）
   *
   * @description 默认为项目根目录
   * @description 可以相对路径，也可以绝对路径
   * @default './'
   */
  base?: string
  /**
   * 类型定义文件名（可选）
   *
   * @description 默认为`async-import.d.ts`或`async-component.d.ts`
   * @default 'async-import.d.ts' | 'async-component.d.ts'
   */
  name?: string
  /**
   * 类型定义文件生成路径（可选）
   *
   * @description 默认为`${base}/${name}`
   * @description 但是如果指定了此`path`字段，则以`path`为准，优先级更高
   * @description 可以相对路径，也可以绝对路径
   * @default `${base}/${name}`
   */
  path?: string
}

export type DtsType = false | { enable: boolean, path: string }

type Enable = 'optimization' | 'async-component' | 'async-import'

export interface IOptions {
  /**
   * 插件功能开关（可选）
   *
   * @description 默认为true，即开启所有功能
   */
  enable?: boolean | Partial<Record<Enable, boolean>>
  /**
   * dts文件输出配置（可选）
   *
   * @description 默认为true，即在项目根目录生成类型定义文件
   */
  dts?: Partial<Omit<IDtsOptions, 'name' | 'path'> & Record<Exclude<Enable, 'optimization'>, IDtsOptions | boolean>> | boolean
}
