import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  parseManifestJson,
  parseManifestJsonOnce,
  parseMiniProgramPagesJson,
} from './config'

let inputDir = ''
let originalCompileTarget: string | undefined
let originalPlatform: string | undefined

beforeEach(() => {
  inputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-optimizer-'))
  originalCompileTarget = process.env.UNI_COMPILE_TARGET
  originalPlatform = process.env.UNI_PLATFORM
})

afterEach(() => {
  fs.rmSync(inputDir, { recursive: true, force: true })
  restoreEnv('UNI_COMPILE_TARGET', originalCompileTarget)
  restoreEnv('UNI_PLATFORM', originalPlatform)
})

describe('parseManifestJson', () => {
  it('parses JSONC without applying uni conditional blocks', () => {
    writeFile('manifest.json', `{
      // comment
      "name": "demo",
      "mp-weixin": {
        /* #ifdef MP-WEIXIN */
        "optimization": {
          "subPackages": true,
        },
        /* #endif */
      }
    }`)

    expect(parseManifestJson(inputDir)).toEqual({
      'name': 'demo',
      'mp-weixin': {
        optimization: {
          subPackages: true,
        },
      },
    })
  })

  it('keeps JSON duplicate key behavior when conditional comments wrap manifest keys', () => {
    writeFile('manifest.json', `{
      // #ifdef MP-WEIXIN
      "mp-weixin": {
        "optimization": {
          "subPackages": false
        }
      },
      // #endif

      // #ifndef MP-WEIXIN
      "mp-weixin": {
        "optimization": {
          "subPackages": true
        }
      }
      // #endif
    }`)

    expect(parseManifestJson(inputDir)).toEqual({
      'mp-weixin': {
        optimization: {
          subPackages: true,
        },
      },
    })
  })

  it('caches manifest parsing per input directory', () => {
    writeFile('manifest.json', `{
      "name": "first"
    }`)

    expect(parseManifestJsonOnce(inputDir).name).toBe('first')

    writeFile('manifest.json', `{
      "name": "second"
    }`)

    expect(parseManifestJson(inputDir).name).toBe('second')
    expect(parseManifestJsonOnce(inputDir).name).toBe('first')
  })

  it('returns empty config for missing manifest when compiling special targets', () => {
    process.env.UNI_COMPILE_TARGET = 'ext-api'

    expect(parseManifestJson(inputDir)).toEqual({})
  })
})

describe('parseMiniProgramPagesJson', () => {
  it('keeps subpackage structure when subpackages option is enabled', () => {
    const { appJson, nvuePages, pageJsons } = parseMiniProgramPagesJson(`{
      "pages": [
        // #ifdef MP-WEIXIN
        {
          "path": "pages/weixin",
        },
        // #else
        {
          "path": "pages/other"
        },
        // #endif
        {
          "path": "pages/common"
        }
      ],
      "subpackages": [
        {
          "root": "sub/",
          "independent": true,
          "pages": [
            {
              "path": "index",
            }
          ],
        }
      ],
    }`, 'mp-weixin', { subpackages: true })

    expect(appJson).toEqual({
      pages: ['pages/weixin', 'pages/common'],
      subPackages: [
        {
          root: 'sub/',
          pages: ['index'],
          independent: true,
        },
      ],
    })
    expect(pageJsons).toEqual({})
    expect(nvuePages).toEqual([])
  })

  it('flattens subpackages into pages by default', () => {
    const { appJson } = parseMiniProgramPagesJson(`{
      "pages": [
        {
          "path": "pages/index"
        }
      ],
      "subPackages": [
        {
          "root": "pkg/",
          "pages": [
            {
              "path": "index"
            },
            {
              "path": "nested/detail"
            }
          ]
        }
      ]
    }`, 'mp-weixin')

    expect(appJson).toEqual({
      pages: ['pages/index', 'pkg/index', 'pkg/nested/detail'],
    })
  })

  it('supports compound conditions', () => {
    const { appJson } = parseMiniProgramPagesJson(`{
      "pages": [
        // #if MP-WEIXIN && !APP
        {
          "path": "pages/mp"
        },
        // #else
        {
          "path": "pages/fallback"
        },
        // #endif
      ]
    }`, 'mp-weixin')

    expect(appJson.pages).toEqual(['pages/mp'])
  })

  it('supports multiple platforms separated by or operators', () => {
    const { appJson } = parseMiniProgramPagesJson(`{
      "pages": [
        // #ifdef MP-WEIXIN || H5
        {
          "path": "pages/shared"
        },
        // #else
        {
          "path": "pages/fallback"
        },
        // #endif
      ]
    }`, 'h5')

    expect(appJson.pages).toEqual(['pages/shared'])
  })

  it('normalizes condition keys with underscores like the official preprocessor', () => {
    const { appJson } = parseMiniProgramPagesJson(`{
      "pages": [
        // #ifdef MP_WEIXIN
        {
          "path": "pages/weixin"
        },
        // #else
        {
          "path": "pages/other"
        },
        // #endif
      ]
    }`, 'mp-weixin')

    expect(appJson.pages).toEqual(['pages/weixin'])
  })

  it('treats elif as regular inactive content like the official preprocessor', () => {
    const { appJson } = parseMiniProgramPagesJson(`{
      "pages": [
        // #if H5
        {
          "path": "pages/h5"
        },
        // #elif MP-WEIXIN
        {
          "path": "pages/weixin"
        },
        // #else
        {
          "path": "pages/fallback"
        },
        // #endif
      ]
    }`, 'mp-weixin')

    expect(appJson.pages).toEqual(['pages/fallback'])
  })

  it('throws when pages are duplicated', () => {
    expect(() => parseMiniProgramPagesJson(`{
      "pages": [
        {
          "path": "pages/index"
        },
        {
          "path": "pages/index"
        }
      ]
    }`, 'mp-weixin')).toThrow('pages.json->pages/index duplication')
  })
})

function writeFile(filename: string, content: string) {
  fs.writeFileSync(path.join(inputDir, filename), content)
}

function restoreEnv(name: 'UNI_COMPILE_TARGET' | 'UNI_PLATFORM', value: string | undefined) {
  if (value === undefined)
    delete process.env[name]
  else
    process.env[name] = value
}
