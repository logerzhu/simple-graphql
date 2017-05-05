// @flow
import * as _ from 'lodash'
import * as graphql from 'graphql'

import Model from '../../Model'
import SG from '../../index'
import StringHelper from '../../utils/StringHelper'

import type {QueryConfig} from '../../Context'

export default function singularQuery (model:Model):QueryConfig {
  const name = StringHelper.toInitialLowerCase(model.name)
  const searchFields = {
    id: {
      $type: SG.modelRef(model.name),
      doc: 'Id of Model ' + model.name
    }
  }
  _.forOwn(model.config.fields, (value, key) => {
    if (!value['$type'] || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve'])) {
      if (value['unique']) {
        searchFields[key] = Object.assign({}, value, {required: false})
      }
    }
  })

  return {
    name: name,
    $type: SG.modelRef(model.name),
    args: searchFields,
    resolve: async function (args:{[argName: string]: any}, context:any, info:graphql.GraphQLResolveInfo, models) {
      return models[model.name].findOne({
        where: {
          ...args
        }
      })
    }
  }
}
