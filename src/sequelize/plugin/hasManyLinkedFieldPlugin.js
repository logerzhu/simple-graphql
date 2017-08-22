// @flow
import _ from 'lodash'

import Schema from '../../schema/Schema'
// import StringHelper from '../../utils/StringHelper'

import resolveConnection from '../resolveConnection'

export default function hasManyLinkedField (schema:Schema<any>, options:any):void {
  // const name = StringHelper.toInitialLowerCase(schema.name)
  // Conver model association to field config
  _.forOwn(schema.config.associations.hasMany, (config, key) => {
    if (config.hidden) {
      return
    }
    schema.links({
      [key]: {
        $type: config.target + 'Connection',
        resolve: async function (root, args, context, info, models) {
          const condition = config.scope || {}
          const sort = config.sort || [{field: 'id', order: 'ASC'}]
          // if (models[hasManyCfg.target].options.underscored) {
          //  condition[StringHelper.toUnderscoredName(_.get(hasManyCfg, 'options.foreignKey', name + 'Id'))] = root.id
          //  for (let item of sort) {
          //    item.field = StringHelper.toUnderscoredName(item.field)
          //  }
          // } else {
          condition[config.foreignField + 'Id'] = root.id
          // }
          return resolveConnection(models[config.target], {...args, condition, sort})
        }
      }
    })
  })
}
