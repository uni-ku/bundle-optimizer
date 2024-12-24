import { AsyncComponentProcessor, type AsyncComponentProcessorOptions } from './plugin/async-component-processor'

export default (options: AsyncComponentProcessorOptions = {}) => {
  return [
    AsyncComponentProcessor(options),
  ]
}
