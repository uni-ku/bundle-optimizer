/* eslint-disable no-console */
import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { setupNunjucks } from '../utils/nunjucks'
import { buildFileSystemTree, transformDataForECharts } from '../utils/visualizer'

const nunjucks = setupNunjucks()

export function depGraphPlugin(): Plugin {
  const templateFileName = 'template.njk'
  // 读取模板文件
  const template = readFileSync(path.resolve(__dirname, templateFileName), 'utf-8')

  return {
    name: 'vite-plugin-uniapp-dependency-graph',
    enforce: 'pre',

    // buildEnd 钩子在每次构建（和重新构建）成功后都会执行
    async buildEnd() {
      console.log('[DepGraph] Starting analysis after build...')

      const fileSystemTree = buildFileSystemTree(Array.from(this.getModuleIds()))

      /**
       * 最外层的基础路径 - 作为节点主要分类
       * @TODO: 一次性展示很多节点观感不好，后续会按照文件夹层次展示视图；
       * 每一个层次内部节点的分类由该层次的 basePath 标记
       */
      const categories = 'basePath' in fileSystemTree ? fileSystemTree.basePath : undefined

      const graphData = transformDataForECharts(this)
      graphData.nodes.forEach((node) => {
        const targetIndex = categories?.findIndex(category => node.id.startsWith(`${category}/`) || node.id === category)
        if (targetIndex !== -1 && targetIndex !== undefined) {
          node.category = targetIndex
        }
      })

      // 使用 NUNJUCKS 渲染 HTML
      const html = nunjucks.renderString(template, {
        title: 'Dependency Graph (Static Report)',
        isDevServer: false,
        dataUrl: '', // 此模式下不需要
        dataJsonString: JSON.stringify(Object.assign(graphData, { categories })),
      })

      const outputDir = process.env.UNI_OUTPUT_DIR || path.resolve(process.cwd(), 'dist')
      const reportPath = path.resolve(outputDir, 'dependency-graph.html')

      try {
        await writeFile(reportPath, html)
        console.log('\x1B[32m%s\x1B[0m', `  > Static Dependency Report generated: ${reportPath}`)
      }
      catch (e) {
        this.warn(`Failed to write dependency graph report: ${e}`)
      }
    },
  }
}
