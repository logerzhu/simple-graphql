import { LRUMap } from 'lru_map'
import { SGCacheManager } from './SGCacheManager'

export class LruCacheManager extends SGCacheManager {
  cacheMap: LRUMap<string, any>

  constructor(limit: number = 1000) {
    super()
    this.cacheMap = new LRUMap<string, any>(limit)
  }

  async get(key) {
    return this.cacheMap.get(key)
  }

  async set(key, value, expire) {
    this.cacheMap.set(key, value)
  }

  async del(pattern) {
    const regExp = new RegExp(
      pattern.replace(/\./g, '.').replace(/\*/g, '.*').replace(/\?/g, '.')
    )
    let count = 0
    for (let [key, value] of this.cacheMap) {
      if (regExp.test(key)) {
        this.cacheMap.delete(key)
        count = count + 1
      }
    }
    return count
  }
}
