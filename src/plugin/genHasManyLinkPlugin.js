// @flow
import _ from 'lodash'
import type { InputFieldOptions, PluginOptions } from '../Definition'

export default ({
  key: 'genHasManyLink',
  defaultOptions: true,
  priority: 99,
  description: 'Gen `HasManyLink` for Schema',
  apply: function hasManyLinkedField (schema, options, schemas): void {
    _.forOwn(schema.config.associations.hasMany, (config, key) => {
      if (config.hidden) {
        return
      }
      const args: { [string]: InputFieldOptions } = {}

      const conditionFields = {}
      _.forOwn(config.conditionFields || {}, async function (value, key) {
        if (!value.$type) {
          value = { $type: value, mapper: (null: any) }
        }
        if (!value.mapper) {
          value.mapper = function (option: { where: Object, attributes: Array<string> }, argValue) {
            if (argValue !== undefined) {
              option.where.$and = option.where.$and || []
              option.where.$and.push({ [key]: argValue })
            }
          }
        }
        conditionFields[key] = value
      })

      if (conditionFields && _.keys(conditionFields).length > 0) {
        args.condition = _.mapValues(conditionFields, field => {
          const { mapper, ...config } = field
          return config
        })
      }

      schema.links({
        [key]: {
          config: config.config,
          args: args,
          $type: config.outputStructure === 'Array' ? [config.target] : config.target + 'Connection',
          dependentFields: [config.sourceKey || 'id'],
          resolve: async function (root, args, context, info, sgContext) {
            if (root[key] !== undefined && (config.conditionFields == null || config.conditionFields.length === 0)) {
              return root[key] || []
            }

            let queryOption = { where: { ...(config.scope || {}) }, bind: [], attributes: [] }

            if (args && args.condition) {
              for (let key of _.keys(conditionFields)) {
                await conditionFields[key].mapper(queryOption, args.condition[key], sgContext)
              }
            }

            let sourceKey = config.sourceKey || 'id'
            let foreignKey = config.foreignKey || (config.foreignField + 'Id')
            queryOption.where[foreignKey] = root[sourceKey]

            const dbModel = sgContext.models[config.target]

            if (config.outputStructure === 'Array') {
              const option = dbModel.resolveQueryOption({
                order: config.order || [['id', 'ASC']],
                info: info,
                attributes: queryOption.attributes
              })
              return dbModel.findAll({
                where: queryOption.where,
                bind: queryOption.bind,
                include: option.include,
                attributes: option.attributes,
                order: option.order
              })
            } else {
              const { condition, ...relayArgs } = args || {}
              return sgContext.models[config.target].resolveRelayConnection({
                pagination: relayArgs,
                selectionInfo: info,
                where: queryOption.where,
                bind: queryOption.bind,
                attributes: queryOption.attributes,
                order: config.order || [['id', 'ASC']]
              })
            }
          }
        }
      })
    })
  }
}: PluginOptions)
