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
    saveMutation?: PluginOptions & { name?: string }
  }
}

export default {
  name: 'saveMutation',
  defaultOptions: {
    enable: false
  },
  priority: 0,
  description: 'Gen `save mutation` for Schema',
  applyToSchema: function (schema, options, schemas) {
    const name = 'save' + StringHelper.toInitialUpperCase(schema.name)
    const savedName = 'saved' + StringHelper.toInitialUpperCase(schema.name)

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
        value.metadata?.graphql?.initializable !== false &&
        value.metadata?.graphql?.updatable !== false
      ) {
        inputFields[key] = {
          ...value,
          nullable: false,
          metadata: { description: value.metadata?.description }
        }
      }
    })

    const { enable, ...config } = options

    schema.mutations({
      [config.name || name]: {
        config: config,
        input: inputFields,
        output: {
          [savedName]: { type: schema.name }
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

          await dbModel.upsert(attrs)
          return {
            [savedName]: dbModel.findOne({ where: attrs })
          }
        }
      }
    })
  }
} as PluginConfig<PluginOptions & { name?: string }>
