import _ from 'lodash'
import StringHelper from '../utils/StringHelper'
import {
  SGHookOptionsMap,
  SGInputFieldConfig,
  SGInputFieldConfigMap,
  SGPluginConfig,
  SGPluginOptions
} from '../index'

type UpdateMutationOptions = SGPluginOptions & {
  name?: string
  hookOptions?: SGHookOptionsMap
}

declare module '../index' {
  export interface PluginOptionsMap {
    updateMutation?: UpdateMutationOptions
  }
}

export default {
  name: 'updateMutation',
  defaultOptions: {
    enable: false
  },
  priority: 0,
  description: 'Gen `update mutation` for Schema',
  applyToSchema: function updateMutation(schema, options, schemas): void {
    const name = 'update' + StringHelper.toInitialUpperCase(schema.name)
    const changedName = 'changed' + StringHelper.toInitialUpperCase(schema.name)

    const isModelType = (fieldOptions: SGInputFieldConfig) => {
      return (
        fieldOptions.type &&
        schemas.find((s) => s.name === fieldOptions.type) != null
      )
    }
    const valuesInputFieldMap: SGInputFieldConfigMap = {}

    _.forOwn(schema.config.fields, (value, key) => {
      if (isModelType(value)) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }
      if (
        value.metadata?.graphql?.hidden !== true &&
        value?.metadata?.graphql?.updatable !== false
      ) {
        valuesInputFieldMap[key] = {
          ...value,
          nullable: true,
          metadata: { description: value.metadata?.description }
        }
      }
    })
    const inputFields: SGInputFieldConfigMap = {
      id: {
        type: schema.name + 'Id',
        nullable: false
      },
      values: {
        properties: valuesInputFieldMap
      }
    }
    const versionConfig = (schema.options.tableOptions || {}).version
    if (versionConfig === true || typeof versionConfig === 'string') {
      inputFields[
        typeof versionConfig === 'string' ? versionConfig : 'version'
      ] = {
        type: 'Integer',
        nullable: true
      }
    }

    if (_.keys(inputFields.values.properties).length === 0) {
      return
    }

    const { enable, ...config } = options

    schema.mutations({
      [config.name || name]: {
        hookOptions: config.hookOptions,
        input: inputFields,
        output: {
          [changedName]: { type: schema.name }
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
              if (args.values[key] !== undefined) {
                values[key] = args.values[key]
              }
            } else if (args.values[key] !== undefined) {
              values[key] = args.values[key]
            }
          })

          const instance = await dbModel.findOne({
            where: { id: args.id },
            lock: true
          })
          if (!instance) {
            throw new Error(schema.name + '[' + args.id + '] not exist.')
          } else {
            if (versionConfig === true || typeof versionConfig === 'string') {
              const versionField =
                typeof versionConfig === 'string' ? versionConfig : 'version'
              if (
                args[versionField] != null &&
                instance[versionField] !== args[versionField]
              ) {
                throw new Error(
                  'OptimisticLockingError: Invalid version number.'
                )
              }
            }
            await instance.update(values)
          }
          return {
            [changedName]: instance
          }
        }
      }
    })
  }
} as SGPluginConfig<UpdateMutationOptions>
