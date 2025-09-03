export class AsyncImports {
  cache: Map<string, string[]> = new Map()
  valueMap: Map<string, string[]> = new Map()

  addCache(id: string, value: string, realPath?: string) {
    if (this.cache.has(id) && !this.cache.get(id)?.includes(value)) {
      this.cache.get(id)?.push(value)
    }
    else if (!this.cache.has(id)) {
      this.cache.set(id, [value])
    }

    if (!realPath) {
      return
    }

    if (this.valueMap.has(value) && !this.valueMap.get(value)?.includes(realPath)) {
      this.valueMap.get(value)?.push(realPath)
    }
    else {
      this.valueMap.set(value, [realPath])
    }
  }

  getCache(id: string) {
    return this.cache.get(id)
  }

  getRealPath(value: string) {
    return this.valueMap.get(value)
  }

  clearCache() {
    this.cache.clear()
    this.valueMap.clear()
  }
}
