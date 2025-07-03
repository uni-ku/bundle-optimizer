export const protobufPackage = 'lixin.common.error.v1'

/** rpc 方法错误声明 */
export interface MethodDescriptor {
  /** rpc方法返回的所有错误 */
  errors: MethodDescriptor_Item[]
}

/** 错误条目 */
export interface MethodDescriptor_Item {
  /** rpc方法返回的错误 */
  error: string
  /** 错误描述 */
  remark: string
}
