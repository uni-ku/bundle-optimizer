declare module 'vue' {
  interface ComponentCustomOptions {
    /**
     * 小程序跨包组件异步引用配置
     */
    componentPlaceholder?:
      | Record<string, 'view'>
      | Record<string, string>
  }
}

export {}
