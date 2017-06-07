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

  const inputFields = {}
  _.forOwn(model.config.fields, (value, key) => {
    if (value instanceof ModelRef || (value && value.$type instanceof ModelRef)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.initializable !== false) {
        inputFields[key] = value
      }
    } else {
      inputFields[key] = value
    }
  })
  let config = {}
  if ((typeof model.config.options.addMutation) === 'object') {
    config = model.config.options.addMutation
  }
  return {
    name: name,
    config: config,
    inputFields: inputFields,
    outputFields: {
      [addedName]: SG.Connection.edgeType(SG.modelRef(model.name))
    },
    mutateAndGetPayload: async function (args:any, context:any, info:graphql.GraphQLResolveInfo, models) {
      const dbModel = models[model.name]
      const attrs = {}

      _.forOwn(model.config.fields, (value, key) => {
        if (value instanceof ModelRef || (value && value.$type instanceof ModelRef)) {
          if (!key.endsWith('Id')) {
            key = key + 'Id'
          }
          if (typeof args[key] !== 'undefined') {
            if (dbModel.options.underscored) {
              attrs[StringHelper.toUnderscoredName(key)] = args[key]
            } else {
              attrs[key] = args[key]
            }
          }
        } else if (typeof args[key] !== 'undefined') {
          attrs[key] = args[key]
        }
      })

      const instance = await dbModel.create(attrs)
      return {
        [addedName]: {
          node: instance,
          cursor: instance.id
        }
      }
    }
  }
}
