// @flow
import _ from 'lodash'
import type { PluginOptions } from '../Definition'

export default ({
  name: 'genHasOneLink',
  defaultOptions: true,
  priority: 99,
  description: 'Gen `HasOneLink` for Schema',
  apply: function hasOneFieldsConfig (schema, options, schemas): void {
    _.forOwn(schema.config.associations.hasOne, (config, key) => {
      if (config.hidden) {
        return
      }
      schema.links({
        [key]: {
          config: config.config,
          $type: config.target,
          description: config.description,
          dependentFields: ['id'],
          resolve: async function (root, args, context, info, sgContext) {
            if (root[key] !== undefined) {
              return root[key]
            } else {
              const dbModel = sgContext.models[config.target]
              return dbModel.findOneForGraphQL({
                where: { ...{ ...(config.scope || {}) }, [config.foreignKey || config.foreignField + 'Id']: root.id }
              }, info)
            }
          }
        }
      })
    })
  }
}: PluginOptions)
