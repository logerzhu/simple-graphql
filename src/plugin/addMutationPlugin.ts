import _ from 'lodash'
import {
  SGHookOptionsMap,
  SGInputFieldConfig,
  SGInputFieldConfigMap,
  SGPluginConfig,
  SGPluginOptions,
  SGSchema
} from '../index'
import StringHelper from '../utils/StringHelper'

type AddMutationOptions = SGPluginOptions & {
  name?: string
  additionFields?: SGInputFieldConfigMap
  duplicateCheck?: boolean
  hookOptions?: SGHookOptionsMap
}

declare module '../index' {
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
      schema instanceof SGSchema &&
      schema.options.tableOptions?.primaryKey?.autoIncrement === false
    ) {
      inputFields['id'] = { type: schema.name, nullable: true }
    }
    const isModelType = (fieldOptions: SGInputFieldConfig) =>
      fieldOptions.type && schemas[fieldOptions.type] != null

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
            schema instanceof SGSchema &&
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

          const getInstance = async () => {
            if (options.duplicateCheck) {
              const existInstance = await dbModel.findOne({ where: attrs })
              if (existInstance) {
                return existInstance
              }
            }
            return dbModel.create(attrs)
          }
          const instance = await getInstance()
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
