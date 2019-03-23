// @flow
import _ from 'lodash'

import Schema from '../../definition/Schema'
// import StringHelper from '../../utils/StringHelper'

export default function hasManyLinkedField (schema:Schema<any>, options:any):void {
  // const name = StringHelper.toInitialLowerCase(schema.name)
  // Conver model association to field config
  _.forOwn(schema.config.associations.hasMany, (config, key) => {
    if (config.hidden) {
      return
    }
    const args:any = {}

    const conditionFields = {}
    _.forOwn(config.conditionFields || {}, async function (config:any, key) {
      if (!config['$type']) {
        config = { $type: config }
      }
      if (!config.mapper) {
        config.mapper = function (option:{where:Object, attributes:Array<string>}, argValue) {
          if (argValue !== undefined) {
            option.where.$and = option.where.$and || []
            option.where.$and.push({ [key]: argValue })
          }
        }
      }
      conditionFields[key] = config
    })

    if (conditionFields && _.keys(conditionFields).length > 0) {
      args['condition'] = _.mapValues(conditionFields, field => {
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
            _.forOwn(conditionFields, async (value, key) => {
              await value.mapper(queryOption, args.condition[key], sgContext)
            })
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
