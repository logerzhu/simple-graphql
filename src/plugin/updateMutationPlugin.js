// @flow
import _ from 'lodash'
import * as graphql from 'graphql'

import Schema from '../../definition/Schema'
import StringHelper from '../../utils/StringHelper'
import type { Plugin } from '../Definition'

export default ({
  key: 'updateMutation',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `update mutation` for Schema',
  apply: function updateMutation (schema: Schema, options: any): void {
    const name = 'update' + StringHelper.toInitialUpperCase(schema.name)
    const changedName = 'changed' + StringHelper.toInitialUpperCase(schema.name)

    const inputFields = {
      id: {
        $type: schema.name + 'Id',
        required: true
      },
      values: {}
    }
    _.forOwn(schema.config.fields, (value, key) => {
      if (typeof value === 'string' || (value && typeof value.$type === 'string')) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }
      if (value && value.$type) {
        if (!value.hidden && value.mutable !== false) {
          inputFields.values[key] = { ...value, required: false, default: null }
        }
      } else {
        inputFields.values[key] = value
      }
    })

    let config = {}
    if ((typeof options) === 'object') {
      config = options
    }

    schema.mutations({
      [config.name || name]: {
        config: config,
        inputFields: inputFields,
        outputFields: {
          [changedName]: schema.name
        },
        mutateAndGetPayload: async function (args, context: any, info: graphql.GraphQLResolveInfo, sgContext) {
          if (args == null || args.values == null) {
            throw new Error('Missing update values.')
          }
          const dbModel = sgContext.models[schema.name]
          const values = {}

          _.forOwn(schema.config.fields, (value, key) => {
            if (typeof value === 'string' || (value && typeof value.$type === 'string')) {
              if (!key.endsWith('Id')) {
                key = key + 'Id'
              }
              if (typeof args.values[key] !== 'undefined') {
                if (dbModel.options.underscored) {
                  values[StringHelper.toUnderscoredName(key)] = args.values[key]
                } else {
                  values[key] = args.values[key]
                }
              }
            } else if (typeof args.values[key] !== 'undefined') {
              values[key] = args.values[key]
            }
          })

          const instance = await dbModel.findOne({ where: { id: args.id } })
          if (!instance) {
            throw new Error(schema.name + '[' + args.id + '] not exist.')
          } else {
            await instance.update(values)
          }
          return {
            [changedName]: instance
          }
        }
      }
    })
  }
}:Plugin)
