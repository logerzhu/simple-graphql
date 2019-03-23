// @flow

import { GraphQLNonNull, GraphQLString, GraphQLObjectType, GraphQLInputObjectType } from 'graphql'
import type { GraphQLFieldConfig } from 'graphql'

export default function mutationWithClientMutationId (config:{
  name:string,
  description:?string,
  inputFields:any,
  outputFields:any,
  mutateAndGetPayload:any
}):GraphQLFieldConfig<any, any> {
  let { name, description, inputFields, outputFields, mutateAndGetPayload } = config

  let augmentedInputFields = Object.assign({}, inputFields, {
    clientMutationId: {
      type: new GraphQLNonNull(GraphQLString)
    }
  })

  let augmentedOutputFields = Object.assign({}, outputFields, {
    clientMutationId: {
      type: new GraphQLNonNull(GraphQLString)
    }
  })
  let outputType = new GraphQLObjectType({
    name: name + 'Payload',
    fields: augmentedOutputFields
  })

  let inputType = new GraphQLInputObjectType({
    name: name + 'Input',
    fields: augmentedInputFields
  })

  return {
    type: outputType,
    description: description,
    args: {
      input: { type: new GraphQLNonNull(inputType) }
    },
    resolve: function resolve (_:any, _ref:any, context:any, info:any) {
      let input = _ref['input']
      return Promise.resolve(mutateAndGetPayload(input, context, info)).then(
        function (payload) {
          payload.clientMutationId = input.clientMutationId
          return payload
        })
    }
  }
}
