import _ from 'lodash'
import { ColumnFieldOptions, ColumnFieldOptionsType, PluginOptions } from '../Definition'
import StringHelper from '../utils/StringHelper'

export default ({
  name: 'bulkAddMutation',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `bulk add mutation` for Schema',
  applyToSchema: function (schema, options, schemas) {
    const name = 'bulkAdd' + StringHelper.toInitialUpperCase(schema.name)
    const addedName = 'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edges'

    const inputFields = {}
    const isModelType = (fieldOptions: ColumnFieldOptions) => {
      if (typeof fieldOptions === 'string') {
        return schemas.find(s => s.name === fieldOptions) != null
      } else if (typeof fieldOptions === 'object') {
        return schemas.find(s => s.name === (fieldOptions as any).$type) != null
      }
      return false
    }
    _.forOwn(schema.config.fields, (value, key) => {
      if (isModelType(value)) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }

      if (value && (<ColumnFieldOptionsType>value).$type) {
        if (!(<ColumnFieldOptionsType>value).hidden && (!(<ColumnFieldOptionsType>value).config || (<ColumnFieldOptionsType>value).config.initializable !== false)) {
          inputFields[key] = value
        }
      } else {
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
        inputFields: {
          values: {
            $type: [inputFields],
            required: true
          }
        },
        outputFields: {
          [addedName]: [schema.name + 'Edge']
        },
        mutateAndGetPayload: async function ({
          values
        }, context, info, sgContext) {
          const dbModel = sgContext.models[schema.name]
          const bulkDatas = []

          for (const value of values) {
            const attrs = {}
            _.forOwn(schema.config.fields, (options, key) => {
              if (isModelType(options)) {
                if (!key.endsWith('Id')) {
                  key = key + 'Id'
                }
                if (typeof value[key] !== 'undefined') {
                  if (dbModel.options.underscored) {
                    attrs[StringHelper.toUnderscoredName(key)] = value[key]
                  } else {
                    attrs[key] = value[key]
                  }
                }
              } else if (typeof value[key] !== 'undefined') {
                attrs[key] = value[key]
              }
            })
            bulkDatas.push(attrs)
          }

          const instances = await dbModel.bulkCreate(bulkDatas)
          return {
            [addedName]: instances.map(instance => {
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
} as PluginOptions)
