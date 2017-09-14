// @flow
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'

import Schema from '../../schema/Schema'
import StringHelper from '../../utils/StringHelper'

export default function deleteMutation (schema:Schema<any>, options:any):void {
  const name = 'delete' + StringHelper.toInitialUpperCase(schema.name)
  let config = {}
  if ((typeof options) === 'object') {
    config = options
  }
  schema.mutations({
    [name]: {
      config: config,
      inputFields: {
        id: {
          $type: schema.name + 'Id',
          required: true
        }
      },
      outputFields: {
        ok: Boolean,
        ['deleted' + schema.name]: schema.name,
        ['deleted' + schema.name + 'Id']: graphql.GraphQLID
      },
      mutateAndGetPayload: async function ({id}, context:any, info:graphql.GraphQLResolveInfo, models) {
        const entity = await models[schema.name].findOne({where: {id: id}})
        if (entity) {
          await entity.destroy()
          return {
            ['deleted' + schema.name]: entity,
            ['deleted' + schema.name + 'Id']: relay.toGlobalId(schema.name, id),
            ok: true
          }
        }
        throw new Error(schema.name + '[' + id + '] not exist.')
      }
    }
  })
}
