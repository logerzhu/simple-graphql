//@flow
import * as _ from 'lodash'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'

import Model from '../../Model'
import GS from '../../index'
import StringHelper from '../../utils/StringHelper'

import type {QueryConfig} from "../../Context"

export default function singularQuery(model:Model):QueryConfig {
  const name = StringHelper.toInitialLowerCase(model.name)
  const searchFields = {
    id: {
      $type: GS.modelRef(model.name),
      doc: "Id of Model " + model.name
    }
  }
  _.forOwn(model.config.fields, (value, key) => {
      if (!value['$type'] || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve'])) {
        if (value['unique']) {
          searchFields[key] = Object.assign({}, value, {required: false})
        }
      }
    }
  )
  return {
    name: name,
    $type: GS.modelRef(model.name),
    args: searchFields,
    resolve: async function (args:{[argName: string]: any}, info:graphql.GraphQLResolveInfo, models) {
      return await models[model.name].findOne({
        where: {
          ...args
        }
      })
    }
  }
}