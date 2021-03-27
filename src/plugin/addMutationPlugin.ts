import _ from 'lodash'
import {
  InputFieldConfig,
  InputFieldConfigMap,
  PluginConfig,
  PluginOptions
} from '../Definition'
import StringHelper from '../utils/StringHelper'

declare module '../Definition' {
  interface PluginOptionsMap {
    addMutation?: PluginOptions & { name?: string }
  }
}

export default {
  name: 'addMutation',
  defaultOptions: {
    enable: false
  },
  priority: 0,
  description: 'Gen `add mutation` for Schema',
  applyToSchema: function (schema, options, schemas) {
    const name = 'add' + StringHelper.toInitialUpperCase(schema.name)
    const addedName =
      'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edge'

    const inputFields: InputFieldConfigMap = {}
    const isModelType = (fieldOptions: InputFieldConfig) => {
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
    const { enable, ...config } = options
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
              if (args[key] !== undefined) {
                attrs[key] = args[key]
              }
            } else if (args[key] !== undefined) {
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
} as PluginConfig<PluginOptions & { name?: string }>
