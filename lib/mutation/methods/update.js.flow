// @flow
import _ from 'lodash'
import * as graphql from 'graphql'

import Model from '../../Model'
import GS from '../../index'
import StringHelper from '../../utils/StringHelper'

import type {MutationConfig} from '../../Context'

export default function updateMutation (model:Model):MutationConfig {
  const name = 'update' + StringHelper.toInitialUpperCase(model.name)
  const changedName = 'changed' + StringHelper.toInitialUpperCase(model.name)

  const config = {
    id: {
      $type: GS.modelRef(model.name),
      required: true
    },
    values: {}
  }
  _.forOwn(model.config.fields, (value, key) => {
    if (value instanceof GS.ModelRef || (value && value.$type instanceof GS.ModelRef)) {
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
      [changedName]: GS.modelRef(model.name)
    },
    mutateAndGetPayload: async function ({id, values}, context:any, info:graphql.GraphQLResolveInfo, models) {
      const instance = await models[model.name].findOne({where: {id: id}})
      if (!instance) {
        throw new Error(model.name + '[' + id + '] not exist.')
      } else {
        await instance.update(values)
      }
      return {
        [changedName]: instance
      }
    }
  }
}
