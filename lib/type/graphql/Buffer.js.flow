// @flow

import {GraphQLScalarType, GraphQLError, Kind} from 'graphql'

export default new GraphQLScalarType({
  name: 'Buffer',
  description: "Base64 encoding of Buffer data",

  serialize(value) {
    if (!(value instanceof Buffer)) {
      throw new TypeError('Field error: value is not an instance of Buffer')
    }
    return value.toString('base64')
  },

  parseValue(value) {
    if (typeof value === "string") {
      return Buffer.from(value, 'base64')
    } else {
      throw new TypeError('Field error: value is not an instance of string')
    }
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Query error: Can only parse base64 string to Buffer but got a: ' + ast.kind, [ast])
    }
    return Buffer.from(ast.value, 'base64')
  }
})
