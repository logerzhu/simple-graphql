import * as _ from 'lodash'

import StringHelper from '../utils/StringHelper'
import {
  SGHookOptionsMap,
  SGInputFieldConfig,
  SGInputFieldConfigMap,
  SGPluginConfig,
  SGPluginOptions
} from '../index'

type SingularQueryOptions = SGPluginOptions & {
  name?: string
  hookOptions?: SGHookOptionsMap
}

declare module '../index' {
  export interface PluginOptionsMap {
    singularQuery?: SingularQueryOptions
  }
}

export default {
  name: 'singularQuery',
  defaultOptions: {
    enable: false
  },
  priority: 0,
  description: 'Gen `singular query` for Schema',
  applyToSchema: function singularQuery(schema, options, schemas): void {
    const name = StringHelper.toInitialLowerCase(schema.name)

    const isModelType = (fieldOptions: SGInputFieldConfig) => {
      return (
        fieldOptions.type &&
        schemas.find((s) => s.name === fieldOptions.type) != null
      )
    }
    //TODO support mapper setting

    const searchFields: SGInputFieldConfigMap = {
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

    const { enable, ...config } = options

    schema.queries({
      [config.name || name]: {
        hookOptions: config.hookOptions,
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
} as SGPluginConfig<SingularQueryOptions>
