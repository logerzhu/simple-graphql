// @flow

import _ from 'lodash'
import {GraphQLScalarType, GraphQLError, Kind} from 'graphql'
import {fromGlobalId} from 'graphql-relay'

/**
 * 生产 query or mutation 的inputType,自动把globalId 转换回 mongodb id
 * @param typeName
 * @returns {"graphql".GraphQLScalarType<string>}
 */

function defGlobalIdInputType(typeName:string):GraphQLScalarType {
  return new GraphQLScalarType({
    name: typeName + 'Id',
    description: "Global id of " + typeName,
    serialize(value) {
      throw new Error('Unsupported!!')
    },
    parseValue(value) {
      if (typeof value === "string") {
        const { type, id } = fromGlobalId(value)
        if (type === typeName) {
          return id
        }
        throw new Error("Incorrect globalId type: " + type)
      }
      else {
        throw new Error("Incorrect globalId format: ", value)
      }
    },
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse string to GrobalId but got a: ' + ast.kind, [ast])
      }
      const value = ast.value
      if (typeof value === "string") {
        const { type, id } = fromGlobalId(value)
        if (type === typeName) {
          return id
        }
        throw new Error("Incorrect globalId type: " + type)
      }
      else {
        throw new Error("Incorrect globalId format: ", value)
      }
    }
  })
}

const types:{[id:string]:GraphQLScalarType} = {}

/**
 * 返回指定类型的Global ID input
 * @param typeName
 * @returns {GraphQLScalarType<string>}
 */
export default function globalIdInputType(typeName:string):GraphQLScalarType {
  if (!types[typeName]) {
    types[typeName] = defGlobalIdInputType(typeName)
  }
  return types[typeName]
}
