// @flow
import * as _ from 'lodash'

import Model from '../../Model'
import ModelRef from '../../ModelRef'
import Connection from '../../Connection'
import StringHelper from '../../utils/StringHelper'

import type {LinkedFieldConfig} from '../../Definition'

export default function hasManyFieldsConfig (model:Model):{[string]:LinkedFieldConfig} {
  const config = ({}:{[string]:LinkedFieldConfig})
  const name = StringHelper.toInitialLowerCase(model.name)
  // Conver model association to field config
  for (let hasManyCfg of model.config.associations.hasMany) {
    if (hasManyCfg.hidden) {
      continue
    }
    const fieldName = _.get(hasManyCfg, 'options.as', name + 's')
    config[fieldName] = {
      $type: Connection.connectionType(new ModelRef(hasManyCfg.target)),
      args: {
        ...Connection.args
      },
      resolve: async function (root, args, context, info, models) {
        const condition = {..._.get(hasManyCfg, 'options.scope', {})}
        condition[_.get(hasManyCfg, 'options.foreignKey', name + 'Id')] = root.id
        const sort = _.get(hasManyCfg, 'options.sort', [{field: 'id', order: 'ASC'}])
        return Connection.resolve(models[hasManyCfg.target], {...args, condition, sort})
      }
    }
  }
  return config
}
