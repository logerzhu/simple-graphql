import * as _ from 'lodash'

import StringHelper from '../utils/StringHelper'
import { InputFieldOptions, PluginOptions } from '../Definition'

export default {
  name: 'singularQuery',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `singular query` for Schema',
  applyToSchema: function singularQuery(schema, options, schemas): void {
    const name = StringHelper.toInitialLowerCase(schema.name)

    const isModelType = (fieldOptions: InputFieldOptions) => {
      return (
        fieldOptions.type &&
        schemas.find((s) => s.name === fieldOptions.type) != null
      )
    }

    const searchFields: { [key: string]: InputFieldOptions } = {
      id: {
        type: schema.name + 'Id',
        metadata: {
          description: 'Id of Schema ' + schema.name
        }
      }
    }
    _.forOwn(schema.config.fields, (value, key) => {
      if (
        value.metadata?.graphql?.hidden !== true &&
        value.metadata?.column?.unique !== true
      ) {
        if (isModelType(value)) {
          if (!key.endsWith('Id')) {
            key = key + 'Id'
          }
        }
        searchFields[key] = {
          ...value,
          nullable: true,
          metadata: { description: value.metadata?.description }
        }
      }
    })

    let config: { [key: string]: any } = {}
    if (typeof options === 'object') {
      config = options
    }

    schema.queries({
      [name]: {
        config: config,
        output: { type: schema.name },
        input: searchFields,
        resolve: async function (args, context, info, sgContext) {
          if (args === null || Object.keys(args).length === 0) {
            return null
          }
          return sgContext.models[schema.name].findOneForGraphQL(
            {
              where: {
                ...args
              }
            },
            context,
            info
          )
        }
      }
    })
  }
} as PluginOptions
