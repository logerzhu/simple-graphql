import * as _ from 'lodash'

import StringHelper from '../utils/StringHelper'
import { ColumnFieldOptions, ColumnFieldOptionsType, PluginOptions } from '../Definition'

export default ({
  name: 'singularQuery',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `singular query` for Schema',
  applyToSchema: function singularQuery (schema, options, schemas): void {
    const name = StringHelper.toInitialLowerCase(schema.name)

    const isModelType = (fieldOptions: ColumnFieldOptions) => {
      if (typeof fieldOptions === 'string') {
        return schemas.find(s => s.name === fieldOptions) != null
      } else if (typeof fieldOptions === 'object') {
        return schemas.find(s => s.name === (fieldOptions as any).$type) != null
      }
      return false
    }

    const searchFields = {
      id: {
        $type: schema.name + 'Id',
        description: 'Id of Schema ' + schema.name
      }
    }
    _.forOwn(schema.config.fields, (value, key) => {
      if ((<ColumnFieldOptionsType>value).$type && ((<ColumnFieldOptionsType>value).columnOptions && (<ColumnFieldOptionsType>value).columnOptions.unique) && (<ColumnFieldOptionsType>value).hidden !== true) {
        if (isModelType(value)) {
          if (!key.endsWith('Id')) {
            key = key + 'Id'
          }
        }
        searchFields[key] = { ...(<ColumnFieldOptionsType>value), required: false, default: null }
      }
    })

    let config: { [key: string]: any } = {}
    if (typeof options === 'object') {
      config = options
    }

    schema.queries({
      [name]: {
        config: config,
        $type: schema.name,
        args: searchFields,
        resolve: async function (args, context, info, sgContext) {
          if (args === null || Object.keys(args).length === 0) {
            return null
          }
          return sgContext.models[schema.name].findOneForGraphQL({
            where: {
              ...args
            }
          }, info)
        }
      }
    })
  }
} as PluginOptions)
