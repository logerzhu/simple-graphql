import _ from 'lodash'
import {
  ColumnFieldOptions,
  InputFieldOptions,
  PluginOptions
} from '../Definition'
import StringHelper from '../utils/StringHelper'

export default {
  name: 'addMutation',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `add mutation` for Schema',
  applyToSchema: function (schema, options, schemas) {
    const name = 'add' + StringHelper.toInitialUpperCase(schema.name)
    const addedName =
      'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edge'

    const inputFields: { [key: string]: InputFieldOptions } = {}
    const isModelType = (fieldOptions: InputFieldOptions) => {
      return (
        fieldOptions.type &&
        schemas.find((s) => s.name === fieldOptions.type) != null
      )
    }

    _.forOwn(schema.config.fields, (value, key) => {
      if (isModelType(value)) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }

      if (
        value.metadata?.graphql?.hidden !== true &&
        value.metadata?.graphql?.initializable !== false
      ) {
        inputFields[key] = value
      }
    })
    let config: { [key: string]: any } = {}
    if (typeof options === 'object') {
      config = options
    }
    schema.mutations({
      [config.name || name]: {
        config: config,
        input: inputFields,
        output: {
          [addedName]: {
            type: schema.name + 'Edge'
          }
        },
        mutateAndGetPayload: async function (args, context, info, sgContext) {
          const dbModel = sgContext.models[schema.name]
          const attrs = {}

          _.forOwn(schema.config.fields, (value, key) => {
            if (isModelType(value)) {
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
              cursor: (<any>instance).id
            }
          }
        }
      }
    })
  }
} as PluginOptions
