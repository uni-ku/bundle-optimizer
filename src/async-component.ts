import { AsyncComponentProcessor } from './plugin/async-component-processor'

export default (options: Parameters<typeof AsyncComponentProcessor>[0]) => {
  return [
    // 处理 `.vue?async` 查询参数的静态导入
    AsyncComponentProcessor(options),
  ]
}
