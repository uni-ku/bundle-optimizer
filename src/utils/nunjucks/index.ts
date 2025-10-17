import nunjucks from 'nunjucks'

/**
 * Setup Nunjucks environment
 */
export function setupNunjucks() {
  nunjucks.configure('')
    .addGlobal('now', () => {
      return new Date()
    })
    .addFilter('date', (date, format) => {
      if (format === 'toLocaleString') {
        return date.toLocaleString()
      }
      return date.toLocaleString()
    })
  return nunjucks
}
