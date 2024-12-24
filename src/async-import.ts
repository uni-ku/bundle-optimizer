import { AsyncImportProcessor, type AsyncImportProcessorOptions } from './plugin/async-import-processor'

export default (options: AsyncImportProcessorOptions = {}) => {
  return [
    // 处理 `AsyncImport` 函数调用的路径传参
    AsyncImportProcessor(options),
  ]
}
