// @flow
import Schema from '../definition/Schema'
import Service from '../definition/Service'
import type { FieldTypeContext, MutationOptions, ResolverContext } from '../Definition'
import * as graphql from 'graphql'
import _ from 'lodash'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'
import StringHelper from '../utils/StringHelper'
import mutationWithClientMutationId from '../transformer/mutationWithClientMutationId'

export default (schemas: Array<Schema>,
  services: Array<Service>,
  payloadFields: { [string]: graphql.GraphQLFieldConfig<any, any> },
  context: ResolverContext & FieldTypeContext
): { [string]: graphql.GraphQLFieldConfig<any, any> } => {
  const mutations: { [string]: graphql.GraphQLFieldConfig<any, any> } = {}

  const addMutation = (name: string, options: MutationOptions) => {
    if (mutations[name]) {
      throw new Error(`Mutation ${name} already defined.`)
    }

    const inputFields = toGraphQLInputFieldConfigMap(StringHelper.toInitialUpperCase(name), options.inputFields || {}, context)
    const outputFields = toGraphQLFieldConfigMap(name, 'Payload', { ...options.outputFields }, context)
    const payloadFields = _.get(options, 'mutation.payloadFields', [])

    mutations[name] = mutationWithClientMutationId({
      name: StringHelper.toInitialUpperCase(name),
      inputFields: inputFields,
      outputFields: { ...outputFields, ...payloadFields },
      mutateAndGetPayload: context.hookMutationResolve(name, options),
      description: options.description
    })
  }
  for (let schema of schemas) {
    _.forOwn(schema.config.queries, (value, key) => {
      addMutation(key, value)
    })
  }

  for (let service of services) {
    _.forOwn(service.config.queries, (value, key) => {
      addMutation(key, value)
    })
  }

  return mutations
}
