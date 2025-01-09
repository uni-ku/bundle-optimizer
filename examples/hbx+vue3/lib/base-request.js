export function getRequest(path, params) {
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
