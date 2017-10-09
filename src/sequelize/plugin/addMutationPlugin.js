// @flow
import _ from 'lodash'
import * as graphql from 'graphql'

import Schema from '../../definition/Schema'
import StringHelper from '../../utils/StringHelper'

export default function addMutation (schema:Schema<any>, options:any):void {
  const name = 'add' + StringHelper.toInitialUpperCase(schema.name)
  const addedName = 'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edge'

  const inputFields = {}
  _.forOwn(schema.config.fields, (value, key) => {
    if ((typeof value) === 'string' || (value && (typeof value.$type) === 'string')) {
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
  if ((typeof options) === 'object') {
    config = options
  }
  schema.mutations({
    [name]: {
      config: config,
      inputFields: inputFields,
      outputFields: {
        [addedName]: schema.name + 'Edge'
      },
      mutateAndGetPayload: async function (args:any, context:any, info:graphql.GraphQLResolveInfo, sgContext) {
        const dbModel = sgContext.models[schema.name]
        const attrs = {}

        _.forOwn(schema.config.fields, (value, key) => {
          if ((typeof value) === 'string' || (value && (typeof value.$type) === 'string')) {
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
  })
}
