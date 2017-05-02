'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mutationWithClientMutationId;

var _graphql = require('graphql');

/**
 * Returns a GraphQLFieldConfig for the mutation described by the
 * provided MutationConfig.
 */

function mutationWithClientMutationId(config) {
  var name = config.name,
      description = config.description,
      inputFields = config.inputFields,
      outputFields = config.outputFields,
      mutateAndGetPayload = config.mutateAndGetPayload;


  var augmentedInputFields = Object.assign({}, inputFields, {
    clientMutationId: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
    }
  });

  var augmentedOutputFields = Object.assign({}, outputFields, {
    clientMutationId: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
    }
  });
  var outputType = new _graphql.GraphQLObjectType({
    name: name + 'Payload',
    fields: augmentedOutputFields
  });

  var inputType = new _graphql.GraphQLInputObjectType({
    name: name + 'Input',
    fields: augmentedInputFields
  });

  return {
    type: outputType,
    description: description,
    args: {
      input: { type: new _graphql.GraphQLNonNull(inputType) }
    },
    resolve: function resolve(_, _ref, context, info) {
      var input = _ref['input'];
      return Promise.resolve(mutateAndGetPayload(input, context, info)).then(function (payload) {
        payload.clientMutationId = input.clientMutationId;
        return payload;
      });
    }
  };
}