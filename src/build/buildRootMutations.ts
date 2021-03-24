import Schema from '../definition/Schema'
import Service from '../definition/Service'
import {
  FieldTypeContext,
  MutationConfig,
  MutationConfigMap,
  ResolverContext
} from '../Definition'
import * as graphql from 'graphql'
import _ from 'lodash'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'
import StringHelper from '../utils/StringHelper'
import mutationWithClientMutationId from '../transformer/mutationWithClientMutationId'

export default (
  mutationConfigMaps: Array<MutationConfigMap>,
  payloadFields: {
    [key: string]: graphql.GraphQLFieldConfig<any, any>
  },
  context: ResolverContext & FieldTypeContext
): {
  [key: string]: graphql.GraphQLFieldConfig<any, any>
} => {
  const mutations: {
    [key: string]: graphql.GraphQLFieldConfig<any, any>
  } = {}

  const addMutation = (name: string, options: MutationConfig) => {
    if (mutations[name]) {
      throw new Error(`Mutation ${name} already defined.`)
    }

    const inputFields = toGraphQLInputFieldConfigMap(
      StringHelper.toInitialUpperCase(name),
      options.input || {},
      context
    )
    const outputFields = toGraphQLFieldConfigMap(
      name,
      'Payload',
      options.output || {},
      context
    )
    const payloadFields = _.get(options, 'mutation.payloadFields', [])

    mutations[name] = mutationWithClientMutationId({
      name: StringHelper.toInitialUpperCase(name),
      inputFields: inputFields,
      outputFields: { ...outputFields, ...payloadFields },
      mutateAndGetPayload: context.hookMutationResolve(name, options),
      description: options.description
    })
  }
  for (let mutationConfigMap of mutationConfigMaps) {
    _.forOwn(mutationConfigMap, (value, key) => {
      addMutation(key, value)
    })
  }

  return mutations
}
