/* eslint-disable no-console */
export function AsyncPluginDemo() {
  return {
    name: 'async-plugin',
    run() {
      console.log('[async-plugin]', 'run')
      uni.showToast({
        title: '异步插件执行✨',
        mask: true,
        icon: 'success',
      })
    },
  }
}

export default AsyncPluginDemo
