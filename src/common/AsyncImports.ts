export class AsyncImports {
  cache: Map<string, string[]> = new Map()

  addCache(id: string, value: string) {
    if (this.cache.has(id) && !this.cache.get(id)?.includes(value)) {
      this.cache.get(id)?.push(value)
    }
    else {
      this.cache.set(id, [value])
    }
  }

  getCache(id: string) {
    return this.cache.get(id)
  }

  clearCache() {
    this.cache.clear()
  }
}
