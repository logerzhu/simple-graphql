import _ from 'lodash'
import { PluginConfig } from '../index'

export default {
  name: 'genHasOneLink',
  defaultOptions: {
    enable: true
  },
  priority: 99,
  description: 'Gen `HasOneLink` for Schema',
  applyToSchema: function hasOneFieldsConfig(schema, options, schemas): void {
    _.forOwn(schema.config.associations.hasOne, (config, key) => {
      if (config.hidden) {
        return
      }
      schema.links({
        [key]: {
          hookOptions: config.hookOptions,
          output: { type: config.target },
          description: config.description,
          dependentFields: ['id'],
          resolve: async function (root, args, context, info, sgContext) {
            if (root[key] !== undefined) {
              return root[key]
            } else {
              const dbModel = sgContext.models[config.target]
              return dbModel.findOneForGraphQL(
                {
                  where: {
                    ...{ ...(config.scope || {}) },
                    [<string>config.foreignKey ||
                    config.foreignField + 'Id']: root.id
                  }
                },
                context,
                info
              )
            }
          }
        }
      })
    })
  }
} as PluginConfig
