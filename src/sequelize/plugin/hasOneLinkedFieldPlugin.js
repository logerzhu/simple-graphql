// @flow
import _ from 'lodash'

import Schema from '../../definition/Schema'
import StringHelper from '../../utils/StringHelper'

export default function hasOneFieldsConfig (schema:Schema<any>, options:any):void {
  // Conver model association to field config

  _.forOwn(schema.config.associations.hasOne, (config, key) => {
    if (config.hidden) {
      return
    }
    schema.links({
      [key]: {
        config: config.config,
        $type: config.target,
        resolve: async function (root, args, context, info, sgContext) {
          if (root[key] != null) {
            return root[key]
          } else {
            return root['get' + StringHelper.toInitialUpperCase(key)]()
          }
        }
      }
    })
  })
}
