import { copyFile } from 'node:fs/promises'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  sourcemap: true,
  noExternal: ['ast-kit'],
  tsconfig: './tsconfig.json',
  hooks: {
    'build:done': async (context) => {
      await copyFile('src/plugin/template.njk', `${context.options.outDir}/template.njk`)
    },
  },
})
