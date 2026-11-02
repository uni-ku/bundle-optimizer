import path from 'node:path'
import process from 'node:process'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { slash } from '../utils/path'
import { getUniPaths } from './UniPaths'

const envNames = ['VITE_ROOT_DIR', 'UNI_INPUT_DIR', 'UNI_OUTPUT_DIR'] as const
const originalEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]))

beforeAll(() => {
  vi.resetModules()
})

beforeEach(() => {
  envNames.forEach(name => delete process.env[name])
})

afterEach(() => {
  restoreEnv()
})

afterAll(() => {
  restoreEnv()
})

function restoreEnv() {
  envNames.forEach((name) => {
    if (originalEnv[name] === undefined)
      delete process.env[name]
    else
      process.env[name] = originalEnv[name]
  })
}

function setUniPaths(rootDir: string, inputDir: string, outputDir: string) {
  process.env.VITE_ROOT_DIR = rootDir
  process.env.UNI_INPUT_DIR = inputDir
  process.env.UNI_OUTPUT_DIR = outputDir
}

describe('getUniPaths', () => {
  it('模块导入不依赖 uni-app 环境变量', async () => {
    const { default: Optimization } = await import('../index')
    const plugins = Optimization({ enable: false })

    expect(Array.isArray(plugins)).toBe(true)
  })

  it('缺少 VITE_ROOT_DIR 时抛出明确错误', () => {
    setUniPaths('', '/project/src', '/project/dist')

    expect(() => getUniPaths()).toThrow('[bundle-optimizer] `VITE_ROOT_DIR` is not defined')
  })

  it('拒绝位于项目根目录外的源码目录', () => {
    const rootDir = path.resolve('/project')
    const siblingInputDir = path.resolve('/project-x/src')
    setUniPaths(rootDir, siblingInputDir, path.resolve('/project/dist'))

    expect(() => getUniPaths()).toThrow('`UNI_INPUT_DIR` must be inside `VITE_ROOT_DIR`')
  })

  it('拒绝将项目根目录的上一级目录作为源码目录', () => {
    const rootDir = path.resolve('/project/app')
    setUniPaths(rootDir, path.dirname(rootDir), path.join(rootDir, 'dist'))

    expect(() => getUniPaths()).toThrow('`UNI_INPUT_DIR` must be inside `VITE_ROOT_DIR`')
  })

  it('解析路径并计算源码目录差异', () => {
    const rootDir = path.resolve('/project')
    const inputDir = path.resolve('/project/../project/src')
    const outputDir = path.resolve('/project/dist')
    setUniPaths(rootDir, inputDir, outputDir)

    expect(getUniPaths()).toEqual({
      rootDir: slash(rootDir),
      inputDir: slash(inputDir),
      outputDir: slash(outputDir),
      srcDiffPath: 'src',
    })
  })

  it('输出目录变化后重新解析路径', () => {
    const rootDir = path.resolve('/project')
    setUniPaths(rootDir, path.resolve('/project/src'), path.resolve('/project/dist'))
    expect(getUniPaths().outputDir).toBe(slash(path.resolve('/project/dist')))

    process.env.UNI_OUTPUT_DIR = path.resolve('/project/other')
    expect(getUniPaths().outputDir).toBe(slash(path.resolve('/project/other')))
  })

  it('源码目录变化后重新解析路径', () => {
    const rootDir = path.resolve('/project')
    setUniPaths(rootDir, path.resolve('/project/src'), path.resolve('/project/dist'))
    expect(getUniPaths()).toMatchObject({
      inputDir: slash(path.resolve('/project/src')),
      srcDiffPath: 'src',
    })

    process.env.UNI_INPUT_DIR = path.resolve('/project/app')
    expect(getUniPaths()).toMatchObject({
      inputDir: slash(path.resolve('/project/app')),
      srcDiffPath: 'app',
    })
  })

  it('根目录变化后重新校验源码目录', () => {
    const rootDir = path.resolve('/project')
    setUniPaths(rootDir, path.resolve('/project/src'), path.resolve('/project/dist'))
    expect(getUniPaths().rootDir).toBe(slash(rootDir))

    process.env.VITE_ROOT_DIR = path.resolve('/other')
    expect(() => getUniPaths()).toThrow('`UNI_INPUT_DIR` must be inside `VITE_ROOT_DIR`')
  })
})
