declare namespace NodeJS {
  /** `process.env.[xxx]` 只能赋值字符串 */
  interface ProcessEnv {
    /** Vite 项目根目录 */
    VITE_ROOT_DIR?: string
    /** uni-app 构建平台 */
    UNI_PLATFORM?: string
    /** uni-app 业务源码目录 */
    UNI_INPUT_DIR?: string
    /** uni-app 构建产物目录 */
    UNI_OUTPUT_DIR?: string
    /** uni-app 特殊编译目标 */
    UNI_COMPILE_TARGET?: string
    /** 分包优化追踪开关 */
    UNI_OPT_TRACE?: string
  }

  /** 只有在 `process.[xxx]` 才可以赋值复杂对象 */
  interface Process {
    UNI_SUBPACKAGES?: any
  }
}
