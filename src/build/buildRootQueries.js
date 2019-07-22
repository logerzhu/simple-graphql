// @flow
import * as graphql from 'graphql'
import _ from 'lodash'
import * as relay from 'graphql-relay'
import Schema from '../definition/Schema'
import Service from '../definition/Service'
import type { FieldTypeContext, InterfaceContext, QueryOptions, ResolverContext } from '../Definition'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'
import StringHelper from '../utils/StringHelper'

export default (schemas: Array<Schema>, services: Array<Service>,
  context: ResolverContext & FieldTypeContext & InterfaceContext): { [string]: graphql.GraphQLFieldConfig<any, any> } => {
  const queries: { [string]: graphql.GraphQLFieldConfig<any, any> } = {}
  const addQuery = (name: string, options: QueryOptions) => {
    if (queries[name]) {
      throw new Error(`Query ${name} already defined.`)
    }
    const fieldConfig = toGraphQLFieldConfigMap(name, 'Payload', { '': options.$type }, context)['']
    queries[name] = {
      type: fieldConfig.type,
      resolve: context.hookQueryResolve(name, options),
      description: options.description
    }
    if (options.args || fieldConfig.args) {
      queries[name].args = {
        ...fieldConfig.args,
        ...toGraphQLInputFieldConfigMap(
          StringHelper.toInitialUpperCase(name), {
            ...options.args
          }, context)
      }
    }
  }
  for (let schema of schemas) {
    _.forOwn(schema.config.queries, (value, key) => {
      addQuery(key, value)
    })
  }

  for (let service of services) {
    _.forOwn(service.config.queries, (value, key) => {
      addQuery(key, value)
    })
  }

  queries['viewer'] = {
    description: 'Default Viewer implement to include all queries.',
    type: new graphql.GraphQLNonNull(new graphql.GraphQLObjectType({
      name: 'Viewer',
      interfaces: [context.interface('Node')],
      fields: {
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLID) },
        ...queries
      }
    })),
    resolve: () => {
      return {
        _fieldType: 'Viewer',
        id: relay.toGlobalId('Viewer', 'viewer')
      }
    }
  }

  queries['node'] = {
    description: 'Fetches an object given its ID',
    type: context.interface('Node'),
    args: {
      id: {
        type: new graphql.GraphQLNonNull(graphql.GraphQLID),
        description: 'The ID of an object'
      }
    },
    resolve: context.hookQueryResolve('node', {
      $type: { id: 'Id' },
      resolve: async function (args, context, info, sgContext) {
        const id = relay.fromGlobalId(args.id)
        if (id.type === 'Viewer') {
          if (queries['viewer'] && queries['viewer'].resolve) {
            return queries['viewer'].resolve(null, args, context, info)
          }
        }
        if (!sgContext.models[id.type]) return null

        const dbModel = sgContext.models[id.type]
        const option = dbModel.resolveQueryOption({ info: info })
        const record = await dbModel.findOne({
          where: { id: id.id },
          ...option
        })
        return record
      }
    })
  }

  return queries
}
