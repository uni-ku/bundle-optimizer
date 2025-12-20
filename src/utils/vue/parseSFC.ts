// Borrowed from https://github.com/vue-macros/vue-macros/blob/89cb6b2f44bb6b1d5428d6893666fbcff0fa5326/packages/common/src/vue.ts#L27
import type { Program } from '@babel/types'
import type { SFCDescriptor, SFCParseResult, SFCScriptBlock as SFCScriptBlockMixed } from '@vue/compiler-sfc'
import { parse } from '@vue/compiler-sfc'
import { babelParse } from 'ast-kit'

export type SFCScriptBlock = Omit<
  SFCScriptBlockMixed,
    'scriptAst' | 'scriptSetupAst'
>

export type SFC = Omit<SFCDescriptor, 'script' | 'scriptSetup'> & {
  sfc: SFCParseResult
  script?: SFCScriptBlock | null
  scriptSetup?: SFCScriptBlock | null
  lang: string | undefined
  getScriptAst: () => Program | undefined
  getSetupAst: () => Program | undefined
  offset: number
} & Pick<SFCParseResult, 'errors'>

export function parseSFC(code: string, id: string): SFC {
  const sfc = parse(code, {
    filename: id,
  })
  const { descriptor, errors } = sfc

  const scriptLang = sfc.descriptor.script?.lang
  const scriptSetupLang = sfc.descriptor.scriptSetup?.lang

  if (
    sfc.descriptor.script
    && sfc.descriptor.scriptSetup
    && (scriptLang || 'js') !== (scriptSetupLang || 'js')
  ) {
    throw new Error(
      `[vue-macros] <script> and <script setup> must have the same language type.`,
    )
  }

  const lang = scriptLang || scriptSetupLang

  return Object.assign({}, descriptor, {
    sfc,
    lang,
    errors,
    offset: descriptor.scriptSetup?.loc.start.offset ?? 0,
    getSetupAst() {
      if (!descriptor.scriptSetup)
        return
      return babelParse(descriptor.scriptSetup.content, lang, {
        plugins: [['importAttributes', { deprecatedAssertSyntax: true }]],
        cache: true,
      })
    },
    getScriptAst() {
      if (!descriptor.script)
        return
      return babelParse(descriptor.script.content, lang, {
        plugins: [['importAttributes', { deprecatedAssertSyntax: true }]],
        cache: true,
      })
    },
  } satisfies Partial<SFC>)
}
