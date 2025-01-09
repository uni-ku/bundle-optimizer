/* eslint-disable no-console */
export function getRequest(path: string, params: any) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[api:get]', { path, params })
      resolve({
        path,
        params,
      })
    }, 1000)
  })
}
