import { AsyncImportProcessor } from './plugin/async-import-processor'

export default () => {
  return [
    // 处理 `AsyncImport` 函数调用的路径传参
    AsyncImportProcessor(),
  ]
}
