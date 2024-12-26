import type { Enable, IDtsOptions, IOptions } from '../type.d'
import { normalizePath } from '../utils'

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

  get dts() {
    const { dts: origin = true } = this.options

    if (typeof origin === 'boolean') {
      return {
        'async-component': this.generateDtsOptions(origin, 'async-component.d.ts'),
        'async-import': this.generateDtsOptions(origin, 'async-import.d.ts'),
      }
    }

    return {
      'async-component': (origin.enable ?? true) !== false && this.generateDtsOptions(origin['async-component'], 'async-component.d.ts', origin.base),
      'async-import': (origin.enable ?? true) !== false && this.generateDtsOptions(origin['async-import'], 'async-import.d.ts', origin.base),
    }
  }

  generateDtsOptions(params: boolean | IDtsOptions = true, name: string, base = './') {
    if (params === false)
      return false

    const path = typeof params === 'boolean' ? `${normalizePath(base).replace(/\/$/, '')}/${name}` : params.enable !== false && normalizePath(params.path || `${normalizePath(params.base ?? base).replace(/\/$/, '')}/${params.name ?? name}`)
    return path !== false && { enable: true, path }
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
