import type { Enable, IOptions } from '../type'

export class ParseOptions {
  options: IOptions

  constructor(options: IOptions) {
    this.options = options
  }

  get enable() {
    const { enable: origin = true } = this.options

    return typeof origin === 'boolean'
      ? {
          'optimization': origin,
          'async-component': origin,
          'async-import': origin,
        }
      : {
          'optimization': origin.optimization ?? true,
          'async-component': origin['async-component'] ?? true,
          'async-import': origin['async-import'] ?? true,
        }
  }

  get logger() {
    const { logger: origin = false } = this.options
    const _ = ['optimization', 'async-component', 'async-import']
    const temp = typeof origin === 'boolean'
      ? origin ? _ : false
      : origin

    return Object.fromEntries(_.map(item => [item, (temp || []).includes(item)])) as Record<Enable, boolean>
  }
}
