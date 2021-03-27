import { GraphQLError, GraphQLScalarType, Kind } from 'graphql'

export default new GraphQLScalarType({
  name: 'Date',

  serialize(value) {
    if (typeof value === 'string') {
      const dataTime = Date.parse(value)
      if (isNaN(dataTime)) {
        throw new TypeError('value is not an instance of Date')
      } else {
        value = new Date(dataTime)
      }
    }
    if (!(value instanceof Date)) {
      throw new TypeError('value is not an instance of Date')
    }
    if (isNaN(value.getTime())) {
      throw new TypeError('value is an invalid Date')
    }
    return value.toJSON()
  },

  parseValue(value) {
    if (typeof value === 'string') {
      const dataTime = Date.parse(value)
      if (isNaN(dataTime)) {
        throw new TypeError('Invalid date')
      } else {
        return new Date(dataTime)
      }
    } else {
      throw new GraphQLError('Invalid date')
    }
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        'Can only parse strings to dates but got a: ' + ast.kind,
        [ast]
      )
    }
    const dataTime = Date.parse(ast.value)
    if (isNaN(dataTime)) {
      throw new TypeError('Invalid date')
    } else {
      return new Date(dataTime)
    }
  }
})
