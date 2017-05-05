// @flow
import _ from 'lodash'
import * as graphql from 'graphql'

import Model from '../../Model'
import SG from '../../index'
import ModelRef from '../../ModelRef'
import StringHelper from '../../utils/StringHelper'

import type {MutationConfig} from '../../Context'

export default function updateMutation (model:Model):MutationConfig {
  const name = 'update' + StringHelper.toInitialUpperCase(model.name)
  const changedName = 'changed' + StringHelper.toInitialUpperCase(model.name)

  const config = {
    id: {
      $type: SG.modelRef(model.name),
      required: true
    },
    values: {}
  }
  _.forOwn(model.config.fields, (value, key) => {
    if (value instanceof ModelRef || (value && value.$type instanceof ModelRef)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.mutable !== false) {
        config.values[key] = {...value, required: false, default: null}
      }
    } else {
      config.values[key] = value
    }
  })

  return {
    name: name,
    inputFields: config,
    outputFields: {
      [changedName]: SG.modelRef(model.name)
    },
    mutateAndGetPayload: async function (args, context:any, info:graphql.GraphQLResolveInfo, models) {
      if (args == null || args.values == null) {
        throw new Error('Missing update values.')
      }
      const dbModel = models[model.name]
      const values = {}

      _.forOwn(model.config.fields, (value, key) => {
        if (value instanceof ModelRef || (value && value.$type instanceof ModelRef)) {
          if (!key.endsWith('Id')) {
            key = key + 'Id'
          }
          if (typeof args.values[key] !== 'undefined') {
            if (dbModel.options.underscored) {
              values[key.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLocaleLowerCase()] = args.values[key]
            } else {
              values[key] = args.values[key]
            }
          }
        } else if (typeof args.values[key] !== 'undefined') {
          values[key] = args.values[key]
        }
      })

      const instance = await dbModel.findOne({where: {id: args.id}})
      if (!instance) {
        throw new Error(model.name + '[' + args.id + '] not exist.')
      } else {
        await instance.update(values)
      }
      return {
        [changedName]: instance
      }
    }
  }
}
