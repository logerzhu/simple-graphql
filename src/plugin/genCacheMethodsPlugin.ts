import { PluginOptions } from '../Definition'
import LoaderManager from './cache/LoaderManager'
import Sequelize, { FindOptions } from 'sequelize'
import getIncludeModeNames from './cache/getIncludeModeNames'

export default ({
  name: 'genCacheMethods',
  defaultOptions: {
    loaderLimit: 100,
    resultLimit: 100
  },
  priority: 999,
  description: 'Support cache with dataLoader',
  applyToSchema: function (schema, options, schemas) {
    const self = this

    const invokeMethod = async function (method: string, options: FindOptions = {}) {
      const func = await self.loaderManage.getMethod({
        method: method,
        model: schema.name,
        includes: getIncludeModeNames(options)
      })
      return func(options)
    }

    schema.statics({
      withCache: () => {
        return {
          findOne: invokeMethod.bind(null, 'findOne'),
          findAll: invokeMethod.bind(null, 'findAll'),
          count: invokeMethod.bind(null, 'count')
        }
      },
      clearCache: () => self.loaderManage.clear(schema.name)
    })
  },
  applyToModel: function (model, options, models) {
    const self = this
    self.loaderManage = new LoaderManager(models,
      (options && (options as any).loaderLimit) || 100,
      (options && (options as any).resultLimit) || 100
    )

    const cleanCache = options => {
      let transaction = options.transaction
      if (transaction === undefined && (<any>Sequelize)._cls) {
        // TODO Check if Sequelize update
        transaction = (<any>Sequelize)._cls.get('transaction')
      }
      if (transaction) {
        transaction.afterCommit(() => self.loaderManage.clear(model.name))
      }
      self.loaderManage.clear(model.name)
    }
    model.addHook('afterCreate', 'cleanCache', (instance, options) => {
      cleanCache(options)
    })
    model.addHook('afterUpdate', 'cleanCache', (instance, options) => {
      cleanCache(options)
    })
    model.addHook('afterDestroy', 'cleanCache', (instance, options) => {
      cleanCache(options)
    })
    model.addHook('afterSave', 'cleanCache', (instance, options) => {
      cleanCache(options)
    });
    (<any>model).addHook('afterUpsert', 'cleanCache', (instance, options) => {
      cleanCache(options)
    })
    model.addHook('afterBulkCreate', 'cleanCache', (instances, options) => {
      cleanCache(options)
    })
    model.addHook('afterBulkDestroy', 'cleanCache', options => {
      cleanCache(options)
    })
    model.addHook('afterBulkUpdate', 'cleanCache', options => {
      cleanCache(options)
    })
  }

} as PluginOptions)
