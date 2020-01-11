// @flow
import type { PluginOptions } from '../Definition'
import LoaderManager from './cache/LoaderManager'
import type { FindOptions } from 'sequelize'
import getIncludeModeNames from './cache/getIncludeModeNames'

export default ({
  name: 'genCacheMethods',
  defaultOptions: false,
  priority: 0,
  description: 'Support cache with dataLoader',
  applyToSchema: function (schema, options, schemas) {
    const self = this

    const invokeMethod = async function (method: string, options: FindOptions<any>) {
      const func = await self.loaderManage.getMethod({
        method: method,
        model: schema.name,
        includes: getIncludeModeNames(options)
      })
      return func(options)
    }

    schema.statics({
      withCache: {
        findOne: invokeMethod.bind(null, 'findOne'),
        findAll: invokeMethod.bind(null, 'findAll'),
        count: invokeMethod.bind(null, 'count')
      }
    })
  },
  applyToModel: function (model, options, models) {
    const self = this
    self.loaderManage = new LoaderManager(models) // TODO init limit
    model.addHook('afterCreate', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
    model.addHook('afterUpdate', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
    model.addHook('afterDestroy', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
    model.addHook('afterSave', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
    model.addHook('afterUpsert', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
    model.addHook('afterBulkCreate', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
    model.addHook('afterBulkDestroy', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
    model.addHook('afterBulkUpdate', 'cleanCache', () => {
      self.loaderManage.clear(model.name)
    })
  }

}: PluginOptions)
