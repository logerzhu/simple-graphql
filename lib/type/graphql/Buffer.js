'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

exports.default = new _graphql.GraphQLScalarType({
  name: 'Buffer',
  description: 'Base64 encoding of Buffer data',

  serialize: function serialize(value) {
    if (!(value instanceof Buffer)) {
      throw new TypeError('Field error: value is not an instance of Buffer');
    }
    return value.toString('base64');
  },
  parseValue: function parseValue(value) {
    if (typeof value === 'string') {
      return Buffer.from(value, 'base64');
    } else {
      throw new TypeError('Field error: value is not an instance of string');
    }
  },
  parseLiteral: function parseLiteral(ast) {
    if (ast.kind !== _graphql.Kind.STRING) {
      throw new _graphql.GraphQLError('Query error: Can only parse base64 string to Buffer but got a: ' + ast.kind, [ast]);
    }
    return Buffer.from(ast.value, 'base64');
  }
});