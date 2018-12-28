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
    if (config.conditionFields) {
      args['condition'] = config.conditionFields
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
            let condition = config.scope || {}
            if (args && args.condition) {
              condition = {...condition, ...args.condition}
            }
            const sort = config.sort || [{field: 'id', order: 'ASC'}]
            let sourceKey = config.sourceKey || 'id'
            let foreignKey = config.foreignKey || (config.foreignField + 'Id')
            condition[foreignKey] = root[sourceKey]

            const dbModel = sgContext.models[config.target]
            const option = dbModel.resolveQueryOption({info: info})
            return dbModel.findAll({
              where: condition,
              include: option.include,
              attributes: option.attributes,
              order: sort.map(s => [s.field, s.order])
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
            let condition = (args && args.condition) || {}
            if (config.scope) {
              condition = {...condition, ...config.scope}
            }
            const order = config.order || [['id', 'ASC']]
            // if (models[hasManyCfg.target].options.underscored) {
            //  condition[StringHelper.toUnderscoredName(_.get(hasManyCfg, 'options.foreignKey', name + 'Id'))] = root.id
            //  for (let item of sort) {
            //    item.field = StringHelper.toUnderscoredName(item.field)
            //  }
            // } else {
            let sourceKey = config.sourceKey || 'id'
            let foreignKey = config.foreignKey || (config.foreignField + 'Id')
            condition[foreignKey] = root[sourceKey]

            // }
            const dbModel = sgContext.models[config.target]
            const option = dbModel.resolveQueryOption({info: info, path: 'edges.node'})
            return sgContext.models[config.target].resolveRelayConnection({
              ...args,
              where: condition,
              order: order,
              include: option.include,
              attributes: option.attributes
            })
          }
        }
      })
    }
  })
}
