// @flow
import * as _ from 'lodash'
import * as graphql from 'graphql'

import Schema from '../../definition/Schema'
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
    if (!value.$type || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve'])) {
      if (value['unique']) {
        searchFields[key] = Object.assign({}, value, { required: false })
      }
    }
  })

  let config = {}
  if ((typeof options) === 'object') {
    config = options
  }

  schema.queries({
    [config.name || name]: {
      config: config,
      $type: schema.name,
      args: searchFields,
      resolve: async function (args:{[argName: string]: any}, context:any, info:graphql.GraphQLResolveInfo, sgContext) {
        if (args === null || Object.keys(args).length === 0) {
          return null
        }
        const dbModel = sgContext.models[schema.name]
        const option = dbModel.resolveQueryOption({ info: info })
        return sgContext.models[schema.name].findOne({
          where: {
            ...args
          },
          include: option.include,
          attributes: option.attributes,
          order: option.order
        })
      }
    }
  })
}
