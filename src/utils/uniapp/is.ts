import type { RenderDynamicImportOptions } from '../../type'
import type { UniRenderDynamicImportOptions } from './type'

export function isUniRenderDynamicImportOptions(options: RenderDynamicImportOptions): options is UniRenderDynamicImportOptions {
  if (!('chunk' in options) || !('targetChunk' in options) || !('targetModuleId' in options) || !('getTargetChunkImports' in options)) {
    return false
  }
  return typeof (options.chunk ?? {}) === 'object'
    && typeof (options.targetChunk ?? {}) === 'object'
    && typeof (options.targetModuleId ?? '') === 'string'
    && typeof (options.getTargetChunkImports ?? (() => {})) === 'function'
}
