// @flow

import {GraphQLScalarType, GraphQLError, Kind} from 'graphql'
import moment from 'moment'
export default new GraphQLScalarType({
  name: 'Date',

  serialize(value) {
    if (!(value instanceof Date)) {
      throw new TypeError('Field error: value is not an instance of Date')
    }
    if (isNaN(value.getTime())) {
      throw new TypeError('Field error: value is an invalid Date')
    }
    return value.toJSON()
  },

  parseValue(value) {
    if (typeof value === 'string') {
      const result = moment(value)
      if (!result.isValid()) {
        throw new GraphQLError('Query error: Invalid date')
      }
      return result.toDate()
    } else {
      throw new GraphQLError("Query error: Invalid date")
    }

  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Query error: Can only parse strings to dates but got a: ' + ast.kind, [ast])
    }
    const result = moment(ast.value)
    if (!result.isValid()) {
      throw new GraphQLError('Query error: Invalid date', [ast])
    }
    return result.toDate()

    //if (ast.value !== result.toJSON()) {
    //  throw new GraphQLError('Query error: Invalid date format, only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ', [ast])
    //}
  }
})
