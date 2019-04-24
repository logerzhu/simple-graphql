// @flow
import _ from 'lodash'
import StringHelper from '../utils/StringHelper'
import type { ColumnFieldOptions, PluginOptions } from '../Definition'

export default ({
  key: 'updateMutation',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `update mutation` for Schema',
  apply: function updateMutation (schema, options, schemas): void {
    const name = 'update' + StringHelper.toInitialUpperCase(schema.name)
    const changedName = 'changed' + StringHelper.toInitialUpperCase(schema.name)

    const isModelType = (fieldOptions: ColumnFieldOptions) => {
      if (typeof fieldOptions === 'string') {
        return schemas.find(s => s.name === fieldOptions) != null
      } else if (typeof fieldOptions === 'object') {
        return schemas.find(s => s.name === (fieldOptions: any).$type) != null
      }
      return false
    }

    const inputFields = {
      id: {
        $type: schema.name + 'Id',
        required: true
      },
      values: {}
    }
    _.forOwn(schema.config.fields, (value, key) => {
      if (isModelType(value)) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }
      if (value && value.$type) {
        if (!value.hidden && (!value.config || value.config.mutable !== false)) {
          inputFields.values[key] = { ...value, required: false, default: null }
        }
      } else {
        inputFields.values[key] = value
      }
    })
    if (_.keys(inputFields.values).length === 0) {
      return
    }

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
        mutateAndGetPayload: async function (args, context, info, sgContext) {
          if (args == null || args.values == null) {
            throw new Error('Missing update values.')
          }
          const dbModel = sgContext.models[schema.name]
          const values = {}

          _.forOwn(schema.config.fields, (value, key) => {
            if (isModelType(value)) {
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
}: PluginOptions)
