import type { OutputChunk, RenderDynamicImportOptions } from '../../type'

export type UniRenderDynamicImportOptions = RenderDynamicImportOptions & Partial<{
  chunk: OutputChunk
  targetChunk: OutputChunk
  targetModuleId: string
  getTargetChunkImports: () => string[]
}>
