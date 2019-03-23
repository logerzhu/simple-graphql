// @flow
import { GraphQLScalarType, Kind } from 'graphql'

function astToJson (ast) {
  if (ast.kind === Kind.INT) {
    return parseInt(ast.value)
  }
  if (ast.kind === Kind.FLOAT) {
    return parseFloat(ast.value)
  }
  if (ast.kind === Kind.STRING) {
    return ast.value
  }
  if (ast.kind === Kind.BOOLEAN) {
    return ast.value === 'true' || ast.value === true
  }
  if (ast.kind === Kind.LIST) {
    return ast.values.map(astToJson)
  }
  if (ast.kind === Kind.ENUM) {
    return ast.value
  }
  if (ast.kind === Kind.OBJECT) {
    const result = {}
    ast.fields.forEach(field => {
      result[field.name.value] = astToJson(field.value)
    })
    return result
  }
}
export default new GraphQLScalarType({
  name: 'Json',
  serialize (value) {
    return value
  },
  parseValue (value) {
    return value
  },
  parseLiteral (ast) {
    return astToJson(ast)
  }
})
