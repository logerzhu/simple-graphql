import * as graphql from 'graphql'
import _ from 'lodash'
import * as relay from 'graphql-relay'
import Schema from '../definition/Schema'
import Service from '../definition/Service'
import {
  FieldTypeContext,
  InterfaceContext,
  QueryConfig,
  QueryConfigMap,
  ResolverContext
} from '../Definition'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'
import StringHelper from '../utils/StringHelper'

export default (
  queryConfigMaps: Array<QueryConfigMap>,
  context: ResolverContext & FieldTypeContext & InterfaceContext
): {
  [key: string]: graphql.GraphQLFieldConfig<any, any>
} => {
  const queries: {
    [key: string]: graphql.GraphQLFieldConfig<any, any>
  } = {}
  const addQuery = (name: string, options: QueryConfig) => {
    if (queries[name]) {
      throw new Error(`Query ${name} already defined.`)
    }
    const fieldConfig = toGraphQLFieldConfigMap(
      name,
      'Payload',
      { '': options.output },
      context
    )['']
    const finalOptions = { ...options }
    const fieldResolve = fieldConfig.resolve
    if (fieldResolve) {
      const resolve = finalOptions.resolve
      finalOptions.resolve = async function (args, context, info, sgContext) {
        return fieldResolve(
          {
            [info.fieldName]: await resolve(args, context, info, sgContext)
          },
          args,
          context,
          info
        )
      }
    }
    queries[name] = {
      type: fieldConfig.type,
      resolve: context.hookQueryResolve(name, finalOptions),
      description: options.description
    }
    if (options.input || fieldConfig.args) {
      queries[name].args = {
        ...fieldConfig.args,
        ...toGraphQLInputFieldConfigMap(
          StringHelper.toInitialUpperCase(name),
          {
            ...options.input
          },
          context
        )
      }
    }
  }
  for (let queryConfigMap of queryConfigMaps) {
    _.forOwn(queryConfigMap, (value, key) => {
      addQuery(key, value)
    })
  }

  queries.viewer = {
    description: 'Default Viewer implement to include all queries.',
    type: new graphql.GraphQLNonNull(
      new graphql.GraphQLObjectType({
        name: 'Viewer',
        fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLID) },
          ...queries
        }
      })
    ),
    resolve: () => {
      return {
        _fieldType: 'Viewer',
        id: relay.toGlobalId('Viewer', 'viewer')
      }
    }
  }

  queries.node = {
    description: 'Fetches an object given its ID',
    type: context.interface('Node'),
    args: {
      id: {
        type: new graphql.GraphQLNonNull(graphql.GraphQLID),
        description: 'The ID of an object'
      }
    },
    resolve: context.hookQueryResolve('node', {
      output: {
        properties: {
          id: { type: 'Id' }
        }
      },
      resolve: async function (args, context, info, sgContext) {
        const id = relay.fromGlobalId(args.id)
        if (!sgContext.models[id.type]) return null

        const dbModel = sgContext.models[id.type]
        const record = await dbModel.findByPkForGraphQL(
          id.id,
          {},
          context,
          info
        )
        return record
      }
    })
  }

  return queries
}
