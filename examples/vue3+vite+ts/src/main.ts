import { createSSRApp } from 'vue'
import App from './App.vue'

import('./api/test').then((res) => {
  res.default('entry')
})

export function createApp() {
  const app = createSSRApp(App)

  return {
    app,
  }
}
