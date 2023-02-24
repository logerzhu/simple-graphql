import { SGModel, SGModelCtrl } from '../../index'
import Sequelize, { CountOptions, FindOptions } from 'sequelize'
import getIncludeModeNames from './getIncludeModeNames'
import dataToInstance from './dataToInstance'
import instanceToData from './instanceToData'
import { SGCacheManager } from './SGCacheManager'

export default class Cache<M extends SGModel> {
  prefix: string
  cacheManger: SGCacheManager
  model: SGModelCtrl
  expire?: number

  constructor(options: {
    prefix: string
    cacheManger: SGCacheManager
    model: SGModelCtrl
    expire?: number
  }) {
    this.prefix = options.prefix
    this.cacheManger = options.cacheManger
    this.model = options.model
    this.expire = options.expire
  }

  private buildCacheKey(method: string, options?: FindOptions | CountOptions) {
    const self = this
    return `${self.prefix}|${self.cacheManger.buildCacheKey(
      self.model,
      method,
      options
    )}`
  }

  async isCacheValid(options?: FindOptions | CountOptions) {
    options = options || {}
    // 如果当前Transaction中, 关联实体的数据有改动, disable cache
    const self = this
    let transaction = options.transaction
    if (transaction === undefined && (<any>Sequelize)._cls) {
      transaction = (<any>Sequelize)._cls.get('transaction')
    }
    if (transaction && (transaction as any).clearCaches) {
      const relateModelNames = [
        self.model.name,
        ...getIncludeModeNames(options)
      ]
      return (
        (transaction as any).clearCaches.find(
          (cache) => relateModelNames.indexOf(cache.model.name) !== -1
        ) == null
      )
    }
    return true
  }

  async findAll(options?: FindOptions): Promise<M[]> {
    const self = this
    const cacheKey = self.buildCacheKey('findAll', options)

    if ((await self.isCacheValid(options)) === false) {
      return (await self.model.findAll(options)) as M[]
    }

    const cacheValue = await self.cacheManger.get(cacheKey)
    if (cacheValue !== undefined) {
      return cacheValue.map((value) =>
        dataToInstance(value, self.model, options?.include || [])
      )
    } else {
      const lockKey = cacheKey + '$LOCK'
      const lockValue = Date.now()
      await self.cacheManger.set(lockKey, lockValue, 300)
      const result = await self.model.findAll(options)
      if ((await self.cacheManger.get(lockKey)) === lockValue) {
        await self.cacheManger.set(
          cacheKey,
          result.map((r) => instanceToData(r)),
          self.expire
        )
      }
      return result as M[]
    }
  }

  async findOne(options?: FindOptions): Promise<M | null> {
    const self = this
    const cacheKey = self.buildCacheKey('findOne', options)

    if ((await self.isCacheValid(options)) === false) {
      return (await self.model.findOne(options)) as M
    }

    const cacheValue = await self.cacheManger.get(cacheKey)
    if (cacheValue !== undefined) {
      return dataToInstance(
        cacheValue,
        self.model,
        options ? options.include : []
      )
    } else {
      const lockKey = cacheKey + '$LOCK'
      const lockValue = Date.now()
      await self.cacheManger.set(lockKey, lockValue, 300)
      const result = await self.model.findOne(options)
      if ((await self.cacheManger.get(lockKey)) === lockValue) {
        await self.cacheManger.set(
          cacheKey,
          instanceToData(result),
          self.expire
        )
      }
      return result as M
    }
  }

  async count(options?: CountOptions): Promise<number> {
    const self = this
    const cacheKey = self.buildCacheKey('count', options)

    if ((await self.isCacheValid(options)) === false) {
      return self.model.count(options)
    }

    const cacheValue = await self.cacheManger.get(cacheKey)
    if (cacheValue !== undefined) {
      return cacheValue
    } else {
      const lockKey = cacheKey + '$LOCK'
      const lockValue = Date.now()
      await self.cacheManger.set(lockKey, lockValue, 300)
      const result = await self.model.count(options)
      if ((await self.cacheManger.get(lockKey)) === lockValue) {
        await self.cacheManger.set(cacheKey, result, self.expire)
      }
      return result
    }
  }

  async clear() {
    const self = this
    await self.cacheManger.del(`${self.prefix}|*|${self.model.name}|*`)
  }
}
