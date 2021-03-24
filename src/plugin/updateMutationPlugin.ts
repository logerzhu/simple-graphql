import _ from 'lodash'
import StringHelper from '../utils/StringHelper'
import {
  InputFieldConfig,
  InputFieldConfigMap,
  PluginConfig,
  PluginOptions
} from '../Definition'

declare module '../Definition' {
  interface PluginOptionsMap {
    updateMutation?: PluginOptions & { name?: string }
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

    const isModelType = (fieldOptions: InputFieldConfig) => {
      return (
        fieldOptions.type &&
        schemas.find((s) => s.name === fieldOptions.type) != null
      )
    }

    const inputFields: InputFieldConfigMap = {
      id: {
        type: schema.name + 'Id',
        nullable: false
      },
      values: {
        properties: {}
      }
    }
    const versionConfig = (schema.config.options.tableOptions || {}).version
    if (versionConfig === true || typeof versionConfig === 'string') {
      inputFields[
        typeof versionConfig === 'string' ? versionConfig : 'version'
      ] = {
        type: 'Integer',
        nullable: true
      }
    }
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
        inputFields.values.properties[key] = {
          ...value,
          nullable: true,
          metadata: { description: value.metadata?.description }
        }
      }
    })
    if (_.keys(inputFields.values.properties).length === 0) {
      return
    }

    const { enable, ...config } = options

    schema.mutations({
      [config.name || name]: {
        config: config,
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
} as PluginConfig<PluginOptions & { name?: string }>
