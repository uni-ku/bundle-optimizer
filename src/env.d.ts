declare namespace NodeJS {
  /** `process.env.[xxx]` 只能赋值字符串 */
  interface ProcessEnv {
    UNI_PLATFORM?: string
    UNI_INPUT_DIR?: string
    UNI_OPT_TRACE?: string
  }

  /** 只有在 `process.[xxx]` 才可以赋值复杂对象 */
  interface Process {
    UNI_SUBPACKAGES?: any
  }
}
