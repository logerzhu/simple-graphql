import _ from 'lodash'
import {
  SGHookOptionsMap,
  SGInputFieldConfig,
  SGInputFieldConfigMap,
  SGPluginConfig,
  SGPluginOptions
} from '..'
import StringHelper from '../utils/StringHelper'

type BulkAddMutationOptions = SGPluginOptions & {
  name?: string
  hookOptions?: SGHookOptionsMap
}

declare module '..' {
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

    const inputFields: SGInputFieldConfigMap = {}
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
} as SGPluginConfig<BulkAddMutationOptions>
