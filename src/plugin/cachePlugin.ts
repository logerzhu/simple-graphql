import {
  CacheManager,
  HookOptionsMap,
  PluginConfig,
  PluginOptions
} from '../Definition'
import Sequelize from 'sequelize'
import LruCacheManager from './cache/LruCacheManager'
import Cache from './cache/Cache'

type CacheOptions = PluginOptions & {
  prefix?: string
  cacheManager?: CacheManager
  expire?: number
}

declare module '../Definition' {
  interface PluginOptionsMap {
    cache?: CacheOptions
  }
}

export default {
  name: 'cache',
  defaultOptions: {
    prefix: 'SG',
    enable: true
  },
  priority: 999,
  description: 'Support cache with dataLoader',
  applyToModel: function (model, options, models) {
    const self = this
    if (self.cacheManager == null) {
      self.cacheManager = options?.cacheManager || new LruCacheManager()
    }

    const cache = new Cache({
      prefix: options.prefix || 'SG',
      cacheManger: self.cacheManager,
      model: model,
      expire: options.expire
    })

    Object.assign(model, {
      withCache: () => cache,
      clearCache: () => cache.clear()
    })

    const cleanCache = async (options) => {
      let transaction = options.transaction
      if (transaction === undefined && (<any>Sequelize)._cls) {
        // TODO Check if Sequelize update
        transaction = (<any>Sequelize)._cls.get('transaction')
      }
      if (transaction) {
        if (transaction.clearCaches == null) {
          transaction.clearCaches = []
          transaction.afterCommit(async () => {
            for (const c of transaction.clearCaches || []) {
              await c.clear()
            }
            transaction.clearCaches = null
          })
        }
        if (transaction.clearCaches.indexOf(cache) === -1) {
          transaction.clearCaches.push(cache)
        }
      } else {
        await cache.clear()
      }
    }
    model.addHook('afterCreate', 'cleanCache', async (instance, options) => {
      return cleanCache(options)
    })
    model.addHook('afterUpdate', 'cleanCache', async (instance, options) => {
      return cleanCache(options)
    })
    model.addHook('afterDestroy', 'cleanCache', async (instance, options) => {
      return cleanCache(options)
    })
    model.addHook('afterSave', 'cleanCache', async (instance, options) => {
      return cleanCache(options)
    })
    ;(<any>model).addHook(
      'afterUpsert',
      'cleanCache',
      async (instance, options) => {
        return cleanCache(options)
      }
    )
    model.addHook(
      'afterBulkCreate',
      'cleanCache',
      async (instances, options) => {
        return cleanCache(options)
      }
    )
    model.addHook('afterBulkDestroy', 'cleanCache', async (options) => {
      return cleanCache(options)
    })
    model.addHook('afterBulkUpdate', 'cleanCache', async (options) => {
      return cleanCache(options)
    })
  }
} as PluginConfig<CacheOptions>
