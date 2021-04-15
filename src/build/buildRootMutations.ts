import * as graphql from 'graphql'
import _ from 'lodash'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'
import StringHelper from '../utils/StringHelper'
import mutationWithClientMutationId from '../transformer/mutationWithClientMutationId'
import {
  SGMutationConfig,
  SGMutationConfigMap,
  SGResolverContext,
  SGTypeContext
} from '..'

export default (
  mutationConfigMaps: Array<SGMutationConfigMap>,
  payloadFields: {
    [key: string]: graphql.GraphQLFieldConfig<any, any>
  },
  context: SGResolverContext & SGTypeContext
): {
  [key: string]: graphql.GraphQLFieldConfig<any, any>
} => {
  const mutations: {
    [key: string]: graphql.GraphQLFieldConfig<any, any>
  } = {}

  const addMutation = (name: string, options: SGMutationConfig) => {
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
