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
        config = {$type: config}
      }
      if (!config.mapper) {
        config.mapper = function (option:{where:Object, additionFields:Array<string>}, argValue) {
          if (argValue !== undefined) {
            option.where.$and = option.where.$and || []
            option.where.$and.push({[key]: argValue})
          }
        }
      }
      conditionFields[key] = config
    })

    if (conditionFields && _.keys(conditionFields).length > 0) {
      args['condition'] = _.mapValues(conditionFields, field => {
        const {mapper, ...config} = field
        return config
      })
    }

    if (config.outputStructure === 'Array') {
      schema.links({
        [key]: {
          config: config.config,
          args: args,
          $type: [config.target],
          dependentFields: [config.sourceKey || 'id'],
          resolve: async function (root, args, context, info, sgContext) {
            if (root[key] !== undefined && (config.conditionFields == null || config.conditionFields.length === 0)) {
              return root[key] || []
            }

            let queryOption = {where: {...(config.scope || {})}, bind: [], additionFields: []}

            if (args && args.condition) {
              _.forOwn(conditionFields, async (value, key) => {
                await value.mapper(queryOption, args.condition[key], sgContext)
              })
            }

            let sourceKey = config.sourceKey || 'id'
            let foreignKey = config.foreignKey || (config.foreignField + 'Id')
            queryOption.where[foreignKey] = root[sourceKey]

            const dbModel = sgContext.models[config.target]
            const option = dbModel.resolveQueryOption({info: info, additionFields: queryOption.additionFields})
            return dbModel.findAll({
              where: queryOption.where,
              bind: queryOption.bind,
              include: option.include,
              attributes: option.attributes,
              order: config.order || [['id', 'ASC']]
            })
          }
        }
      })
    } else {
      schema.links({
        [key]: {
          config: config.config,
          args: args,
          $type: config.target + 'Connection',
          dependentFields: [config.sourceKey || 'id'],
          resolve: async function (root, args, context, info, sgContext) {
            const {condition, ...relayArgs} = args || {}
            let queryOption = {where: {...(config.scope || {})}, bind: [], additionFields: []}
            if (condition) {
              _.forOwn(conditionFields, async (value, key) => {
                await value.mapper(queryOption, condition[key], sgContext)
              })
            }

            let sourceKey = config.sourceKey || 'id'
            let foreignKey = config.foreignKey || (config.foreignField + 'Id')
            queryOption.where[foreignKey] = root[sourceKey]

            const dbModel = sgContext.models[config.target]
            const option = dbModel.resolveQueryOption({
              info: info,
              path: 'edges.node',
              additionFields: queryOption.additionFields.map(f => 'edges.node.' + f)
            })

            return sgContext.models[config.target].resolveRelayConnection({
              ...relayArgs,
              where: queryOption.where,
              bind: queryOption.bind,
              include: option.include,
              attributes: option.attributes,
              order: config.order || [['id', 'ASC']]
            })
          }
        }
      })
    }
  })
}
