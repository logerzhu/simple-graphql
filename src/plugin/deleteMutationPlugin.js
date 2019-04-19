// @flow
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import StringHelper from '../utils/StringHelper'
import type { Plugin } from '../Definition'

export default ({
  key: 'deleteMutation',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `delete mutation` for Schema',
  apply: function (schema, options, schemas): void {
    const name = 'delete' + StringHelper.toInitialUpperCase(schema.name)
    let config = {}
    if ((typeof options) === 'object') {
      config = options
    }
    schema.mutations({
      [config.name || name]: {
        config: config,
        inputFields: {
          id: {
            $type: schema.name + 'Id',
            required: true
          }
        },
        outputFields: {
          ['deleted' + schema.name]: schema.name,
          ['deleted' + schema.name + 'Id']: graphql.GraphQLID
        },
        mutateAndGetPayload: async function ({ id }, context, info, sgContext) {
          const entity = await sgContext.models[schema.name].findOne({ where: { id: id } })
          if (entity) {
            await entity.destroy()
            return {
              ['deleted' + schema.name]: entity,
              ['deleted' + schema.name + 'Id']: relay.toGlobalId(schema.name, id)
            }
          }
          throw new Error(schema.name + '[' + id + '] not exist.')
        }
      }
    })
  }
}: Plugin)
