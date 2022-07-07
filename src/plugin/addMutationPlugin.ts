import _ from 'lodash'
import {
  SequelizeSGSchema,
  SGHookOptionsMap,
  SGInputFieldConfig,
  SGInputFieldConfigMap,
  SGPluginConfig,
  SGPluginOptions
} from '..'
import StringHelper from '../utils/StringHelper'

type AddMutationOptions = SGPluginOptions & {
  name?: string
  additionFields?: SGInputFieldConfigMap
  hookOptions?: SGHookOptionsMap
}

declare module '..' {
  export interface SGPluginOptionsMap {
    addMutation?: AddMutationOptions
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

    const inputFields: SGInputFieldConfigMap = {
      ...(options.additionFields || {})
    }
    if (
      schema instanceof SequelizeSGSchema &&
      schema.options.tableOptions?.primaryKey?.autoIncrement === false
    ) {
      inputFields['id'] = { type: schema.name, nullable: true }
    }
    const isModelType = (fieldOptions: SGInputFieldConfig) => {
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
        hookOptions: config.hookOptions,
        input: inputFields,
        output: {
          [addedName]: {
            type: schema.name + 'Edge'
          }
        },
        mutateAndGetPayload: async function (args, context, info, sgContext) {
          const dbModel = sgContext.models[schema.name]
          const attrs = {}

          if (
            schema instanceof SequelizeSGSchema &&
            schema.options.tableOptions?.primaryKey?.autoIncrement === false
          ) {
            attrs['id'] = args['id']
          }

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
} as SGPluginConfig<AddMutationOptions>
