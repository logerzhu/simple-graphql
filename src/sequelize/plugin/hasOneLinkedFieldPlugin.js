// @flow
import _ from 'lodash'

import Schema from '../../definition/Schema'

export default function hasOneFieldsConfig (schema:Schema, options:any):void {
  // Conver model association to field config

  _.forOwn(schema.config.associations.hasOne, (config, key) => {
    if (config.hidden) {
      return
    }
    schema.links({
      [key]: {
        config: config.config,
        $type: config.target,
        dependentFields: ['id'],
        resolve: async function (root, args, context, info, sgContext) {
          if (root[key] !== undefined) {
            return root[key]
          } else {
            const dbModel = sgContext.models[config.target]
            const option = dbModel.resolveQueryOption({ info: info })
            return dbModel.findOne({
              where: { [config.foreignKey || config.foreignField + 'Id']: root['id'] },
              include: option.include,
              attributes: option.attributes,
              order: option.order
            })
          }
        }
      }
    })
  })
}
