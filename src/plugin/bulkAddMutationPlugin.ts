import _ from 'lodash'
import {
  HookOptionsMap,
  InputFieldConfig,
  InputFieldConfigMap,
  PluginConfig,
  PluginOptions
} from '../index'
import StringHelper from '../utils/StringHelper'

type BulkAddMutationOptions = PluginOptions & {
  name?: string
  hookOptions?: HookOptionsMap
}

declare module '../index' {
  export interface PluginOptionsMap {
    bulkAddMutation?: BulkAddMutationOptions
  }
}

export default {
  name: 'bulkAddMutation',
  defaultOptions: {
    enable: false
  },
  priority: 0,
  description: 'Gen `bulk add mutation` for Schema',
  applyToSchema: function (schema, options, schemas) {
    const name = 'bulkAdd' + StringHelper.toInitialUpperCase(schema.name)
    const addedName =
      'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edges'

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
        hookOptions: config.hookOptions,
        input: {
          values: {
            elements: { properties: inputFields },
            nullable: false
          }
        },
        output: {
          [addedName]: {
            elements: { type: schema.name + 'Edge' }
          }
        },
        mutateAndGetPayload: async function (
          { values },
          context,
          info,
          sgContext
        ) {
          const dbModel = sgContext.models[schema.name]
          const bulkDatas: any[] = []

          for (const value of values) {
            const attrs: any = {}
            _.forOwn(schema.config.fields, (options, key) => {
              if (isModelType(options)) {
                if (!key.endsWith('Id')) {
                  key = key + 'Id'
                }
                if (value[key] !== undefined) {
                  attrs[key] = value[key]
                }
              } else if (value[key] !== undefined) {
                attrs[key] = value[key]
              }
            })
            bulkDatas.push(attrs)
          }

          const instances = await dbModel.bulkCreate(bulkDatas)
          return {
            [addedName]: instances.map((instance) => {
              return {
                node: instance,
                cursor: (<any>instance).id
              }
            })
          }
        }
      }
    })
  }
} as PluginConfig<BulkAddMutationOptions>
