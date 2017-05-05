// @flow
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'

import Model from '../../Model'
import SG from '../../index'
import StringHelper from '../../utils/StringHelper'

import type {MutationConfig} from '../../Context'

export default function deleteMutation (model:Model):MutationConfig {
  const name = 'delete' + StringHelper.toInitialUpperCase(model.name)
  return {
    name: name,
    inputFields: {
      id: {
        $type: SG.modelRef(model.name),
        required: true
      }
    },
    outputFields: {
      ok: Boolean,
      ['deleted' + model.name]: SG.modelRef(model.name),
      ['deleted' + model.name + 'Id']: graphql.GraphQLID
    },
    mutateAndGetPayload: async function ({id}, context:any, info:graphql.GraphQLResolveInfo, models) {
      const entity = await models[model.name].findOne({where: {id: id}})
      if (entity) {
        await entity.destroy()
        return {
          ['deleted' + model.name]: entity,
          ['deleted' + model.name + 'Id']: relay.toGlobalId(model.name, id),
          ok: true
        }
      }
      throw new Error(model.name + '[' + id + '] not exist.')
    }
  }
}
