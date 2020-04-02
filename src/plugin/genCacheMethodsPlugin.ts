
import { PluginOptions } from "../Definition";
import LoaderManager from "./cache/LoaderManager";
import { FindOptions } from "sequelize";
import Sequelize from "sequelize";
import getIncludeModeNames from "./cache/getIncludeModeNames";

export default ({
  name: 'genCacheMethods',
  defaultOptions: true,
  priority: 999,
  description: 'Support cache with dataLoader',
  applyToSchema: function (schema, options, schemas) {
    const self = this;

    const invokeMethod = async function (method: string, options: FindOptions<any> = {}) {
      const func = await self.loaderManage.getMethod({
        method: method,
        model: schema.name,
        includes: getIncludeModeNames(options)
      });
      return func(options);
    };

    schema.statics({
      withCache: {
        findOne: invokeMethod.bind(null, 'findOne'),
        findAll: invokeMethod.bind(null, 'findAll'),
        count: invokeMethod.bind(null, 'count')
      },
      clearCache: () => self.loaderManage.clear(schema.name)
    });
  },
  applyToModel: function (model, options, models) {
    const self = this;
    self.loaderManage = new LoaderManager(models); // TODO init limit

    const cleanCache = options => {
      let transaction = options.transaction;
      if (transaction === undefined && Sequelize._cls) {
        // TODO Check if Sequelize update
        transaction = Sequelize._cls.get('transaction');
      }
      if (transaction) {
        transaction.afterCommit(() => self.loaderManage.clear(model.name));
      } else {
        self.loaderManage.clear(model.name);
      }
    };
    model.addHook('afterCreate', 'cleanCache', (instance, options) => {
      cleanCache(options);
    });
    model.addHook('afterUpdate', 'cleanCache', (instance, options) => {
      cleanCache(options);
    });
    model.addHook('afterDestroy', 'cleanCache', (instance, options) => {
      cleanCache(options);
    });
    model.addHook('afterSave', 'cleanCache', (instance, options) => {
      cleanCache(options);
    });
    model.addHook('afterUpsert', 'cleanCache', (instance, options) => {
      cleanCache(options);
    });
    model.addHook('afterBulkCreate', 'cleanCache', (instances, options) => {
      cleanCache(options);
    });
    model.addHook('afterBulkDestroy', 'cleanCache', options => {
      cleanCache(options);
    });
    model.addHook('afterBulkUpdate', 'cleanCache', options => {
      cleanCache(options);
    });
  }

} as PluginOptions);