// @flow
import * as _ from 'lodash'
import * as graphql from 'graphql'

import Schema from '../../schema/Schema'
import StringHelper from '../../utils/StringHelper'

export default function singularQuery (schema:Schema, options:any):void {
  const name = StringHelper.toInitialLowerCase(schema.name)
  const searchFields = {
    id: {
      $type: schema.name + 'Id',
      description: 'Id of Schema ' + schema.name
    }
  }
  _.forOwn(schema.config.fields, (value, key) => {
    if (!value['$type'] || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve'])) {
      if (value['unique']) {
        searchFields[key] = Object.assign({}, value, {required: false})
      }
    }
  })

  let config = {}
  if ((typeof schema.config.options.singularQuery) === 'object') {
    config = schema.config.options.singularQuery
  }

  schema.queries({
    [name]: {
      config: config,
      $type: schema.name,
      args: searchFields,
      resolve: async function (args:{[argName: string]: any}, context:any, info:graphql.GraphQLResolveInfo, models) {
        if (args === null || Object.keys(args).length === 0) {
          return null
        }
        return models[schema.name].findOne({
          where: {
            ...args
          }
        })
      }
    }
  })
}
