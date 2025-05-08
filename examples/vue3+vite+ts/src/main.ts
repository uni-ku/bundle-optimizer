import { createSSRApp } from 'vue'
import App from './App.vue'
import demo from './api/test'

demo('entry')

export function createApp() {
  const app = createSSRApp(App)

  return {
    app,
  }
}
