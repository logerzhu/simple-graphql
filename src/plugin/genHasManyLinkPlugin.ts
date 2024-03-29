import _ from 'lodash'
import {
  SGConditionFieldMapper,
  SGInputFieldConfig,
  SGInputFieldConfigMap,
  SGPluginConfig,
  SGSchema
} from '../index'
import Sequelize, { FindOptions } from 'sequelize'

export default {
  name: 'genHasManyLink',
  defaultOptions: {
    enable: true
  },
  priority: 99,
  description: 'Gen `HasManyLink` for Schema',
  applyToSchema: function hasManyLinkedField(schema, options, schemas): void {
    if (schema instanceof SGSchema) {
      _.forOwn(schema.config.associations.hasMany, (config, key) => {
        if (config.hidden) {
          return
        }
        const args: SGInputFieldConfigMap = {}

        const conditionFields: {
          [key: string]: {
            definition: SGInputFieldConfig
            mapper: SGConditionFieldMapper
          }
        } = {}
        _.forOwn(config.conditionFields || {}, async function (value, key) {
          conditionFields[key] = {
            definition: value,
            mapper:
              value.metadata?.graphql?.mapper ||
              function (option, argValue) {
                if (argValue !== undefined) {
                  option.where[Sequelize.Op.and] =
                    option.where[Sequelize.Op.and] || []
                  option.where[Sequelize.Op.and].push({ [key]: argValue })
                }
              }
          }
        })

        if (conditionFields && _.keys(conditionFields).length > 0) {
          args.condition = {
            properties: _.mapValues(conditionFields, (field) => {
              const { mapper, definition } = field
              return definition
            })
          }
        }

        schema.links({
          [key]: {
            hookOptions: config.hookOptions,
            description: config.description,
            input: args,
            output:
              config.outputStructure === 'Array'
                ? { elements: { type: config.target } }
                : { type: config.target + 'Connection' },
            dependentFields: [config.sourceKey || 'id'],
            resolve: async function (root, args, context, info, sgContext) {
              if (
                root[key] !== undefined &&
                (config.conditionFields == null ||
                  _.keys(config.conditionFields).length === 0)
              ) {
                return root[key] || []
              }

              const queryOption: any = {
                where: { ...(config.scope || {}) },
                bind: [],
                attributes: []
              }

              if (args && args.condition) {
                for (const key of _.keys(conditionFields)) {
                  await conditionFields[key].mapper(
                    queryOption,
                    args.condition[key],
                    sgContext
                  )
                }
              }

              const sourceKey = config.sourceKey || 'id'
              const foreignKey =
                <string>config.foreignKey || config.foreignField + 'Id'
              queryOption.where[foreignKey] = root[sourceKey]

              const dbModel = sgContext.models[config.target]

              if (config.outputStructure === 'Array') {
                const option = dbModel.resolveQueryOption({
                  order: config.order || [['id', 'ASC']],
                  info: info,
                  attributes: queryOption.attributes
                })
                const findOptions: FindOptions = {
                  where: queryOption.where,
                  bind: queryOption.bind,
                  include: option.include,
                  attributes: option.attributes,
                  order: option.order
                }
                if (dbModel.withCache) {
                  return dbModel.withCache().findAll(findOptions)
                } else {
                  return dbModel.findAll(findOptions)
                }
              } else {
                const { condition, ...relayArgs } = args || {}
                return sgContext.models[config.target].resolveRelayConnection({
                  pagination: relayArgs,
                  selectionInfo: info,
                  where: queryOption.where,
                  bind: queryOption.bind,
                  attributes: queryOption.attributes,
                  order: config.order
                })
              }
            }
          }
        })
      })
    }
  }
} as SGPluginConfig
