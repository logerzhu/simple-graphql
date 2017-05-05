// @flow
import _ from 'lodash'
import * as graphql from 'graphql'

import Model from '../../Model'
import ModelRef from '../../ModelRef'
import SG from '../../index'
import StringHelper from '../../utils/StringHelper'

import type {MutationConfig} from '../../Context'

export default function addMutation (model:Model):MutationConfig {
  const name = 'add' + StringHelper.toInitialUpperCase(model.name)
  const addedName = 'added' + StringHelper.toInitialUpperCase(model.name) + 'Edge'

  const config = {}
  _.forOwn(model.config.fields, (value, key) => {
    if (value instanceof ModelRef || (value && value.$type instanceof ModelRef)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.initializable !== false) {
        config[key] = value
      }
    } else {
      config[key] = value
    }
  })
  return {
    name: name,
    inputFields: config,
    outputFields: {
      [addedName]: SG.Connection.edgeType(SG.modelRef(model.name))
    },
    mutateAndGetPayload: async function (args:any, context:any, info:graphql.GraphQLResolveInfo, models) {
      const instance = await models[model.name].create(args)
      return {
        [addedName]: {
          node: instance,
          cursor: instance.id
        }
      }
    }
  }
}
