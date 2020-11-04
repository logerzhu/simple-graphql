import _ from 'lodash'
import StringHelper from '../utils/StringHelper'
import { ColumnFieldOptions, ColumnFieldOptionsType, PluginOptions } from '../Definition'

export default ({
  name: 'updateMutation',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `update mutation` for Schema',
  applyToSchema: function updateMutation (schema, options, schemas): void {
    const name = 'update' + StringHelper.toInitialUpperCase(schema.name)
    const changedName = 'changed' + StringHelper.toInitialUpperCase(schema.name)

    const schemaNames = _.fromPairs(schemas.map(s => [s.name, true]))
    const isModelType = (fieldOptions: ColumnFieldOptions) => {
      if (typeof fieldOptions === 'string') {
        return schemaNames[fieldOptions] === true
      } else if (typeof fieldOptions === 'object') {
        return schemaNames[(fieldOptions as any).$type] === true
      }
      return false
    }

    const inputFields: any = {
      id: {
        $type: schema.name + 'Id',
        required: true
      },
      values: {}
    }
    const versionConfig = (schema.config.options.tableOptions || {}).version
    if (versionConfig === true || typeof versionConfig === 'string') {
      inputFields[typeof versionConfig === 'string' ? versionConfig : 'version'] = {
        $type: 'Integer',
        required: false
      }
    }
    _.forOwn(schema.config.fields, (value, key) => {
      if (isModelType(value)) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }
      if (value && (<ColumnFieldOptionsType>value).$type) {
        if (!(<ColumnFieldOptionsType>value).hidden && (!(<ColumnFieldOptionsType>value).config || (<ColumnFieldOptionsType>value).config.mutable !== false)) {
          inputFields.values[key] = {
            ...(<ColumnFieldOptionsType>value),
            required: false,
            default: null,
            resolve: null
          }
        }
      } else {
        inputFields.values[key] = value
      }
    })
    if (_.keys(inputFields.values).length === 0) {
      return
    }

    let config: any = {}
    if (typeof options === 'object') {
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

          const instance = await dbModel.findOne({ where: { id: args.id }, lock: true })
          if (!instance) {
            throw new Error(schema.name + '[' + args.id + '] not exist.')
          } else {
            if (versionConfig === true || typeof versionConfig === 'string') {
              const versionField = typeof versionConfig === 'string' ? versionConfig : 'version'
              if (args[versionField] != null && instance[versionField] !== args[versionField]) {
                throw new Error('OptimisticLockingError: Invalid version number.')
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
} as PluginOptions)
