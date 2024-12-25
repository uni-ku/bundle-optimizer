import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: false,
  },
  failOnWarn: false,
  // 排除隐式外部依赖
  externals: [
    'chalk',
  ],
})
