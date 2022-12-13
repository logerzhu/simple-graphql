import * as graphql from 'graphql'
import _ from 'lodash'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'
import StringHelper from '../utils/StringHelper'
import {
  SGInterfaceContext,
  SGLinkedFieldConfig,
  SGResolverContext,
  SGSubscriptionConfig,
  SGSubscriptionConfigMap,
  SGTypeContext
} from '..'

export default (
  subscriptionConfigMaps: Array<SGSubscriptionConfigMap>,
  context: SGResolverContext & SGTypeContext & SGInterfaceContext
): {
  [key: string]: graphql.GraphQLFieldConfig<any, any>
} => {
  const subscriptions: {
    [key: string]: graphql.GraphQLFieldConfig<any, any>
  } = {}
  const addSubscription = (name: string, options: SGSubscriptionConfig) => {
    if (subscriptions[name]) {
      throw new Error(`Subscription ${name} already defined.`)
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
      finalOptions.resolve = async function (
        source,
        args,
        context,
        info,
        sgContext
      ) {
        return fieldResolve(
          resolve
            ? {
                [info.fieldName]: await resolve(
                  { [info.fieldName]: source },
                  args,
                  context,
                  info,
                  sgContext
                )
              }
            : { [info.fieldName]: source },
          args,
          context,
          info
        )
      }
    }
    subscriptions[name] = {
      type: fieldConfig.type,
      resolve: finalOptions.resolve
        ? context.hookFieldResolve(name, finalOptions as SGLinkedFieldConfig)
        : undefined,
      subscribe: context.hookSubscriptionResolve(name, finalOptions),
      description: options.description
    }
    if (options.input || fieldConfig.args) {
      subscriptions[name].args = {
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
  for (let subscriptionConfigMap of subscriptionConfigMaps) {
    _.forOwn(subscriptionConfigMap, (value, key) => {
      addSubscription(key, value)
    })
  }
  return subscriptions
}
