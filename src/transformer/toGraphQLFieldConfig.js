//@flow
import _ from 'lodash'

import * as graphql from 'graphql'

import type {GraphQLFieldConfig} from 'graphql'

import Type from '../type'
import Context from '../Context'
import StringHelper from "../utils/StringHelper"
import Connection from "../Connection"
import ModelRef from '../ModelRef'
import toGraphQLInputFieldMap from "./toGraphQLInputFieldMap"

const toGraphQLFieldConfig = function (name:string,
                                       postfix:string,
                                       fieldType:any,
                                       context:Context,
                                       interfaces:any = []):GraphQLFieldConfig<any,any> {

  const typeName = (path:string) => {
    return path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join("")
  }

  if (graphql.isOutputType(fieldType)) {
    return {type: fieldType}
  }
  if (fieldType instanceof Type.ScalarFieldType) {
    return {type: fieldType.graphQLOutputType}
  }
  switch (fieldType) {
    case String:
      return {type: graphql.GraphQLString}
    case Number:
      return {type: graphql.GraphQLFloat}
    case Boolean:
      return {type: graphql.GraphQLBoolean}
    case Date:
      return {type: Type.GraphQLScalarTypes.Date}
    case JSON:
      return {type: Type.GraphQLScalarTypes.Json}
  }

  if (_.isArray(fieldType)) {
    const elementType = toGraphQLFieldConfig(name, postfix, fieldType[0], context).type
    return {
      type: new graphql.GraphQLList(elementType),
      resolve: async function () {
        return null
      }
    }
  }

  if (fieldType instanceof ModelRef) {
    return {
      type: context.graphQLObjectType(fieldType.name),
      resolve: context.wrapResolve('field', {
        name: name.split("\.").slice(-1)[0],
        path: name,
        $type: context.graphQLObjectType(fieldType.name),
        resolve: async function (root, args, info, models) {
          const fieldName = name.split("\.").slice(-1)[0]
          //判断是否只有model Id, 如果只有model Id, 通过ID 查找相关的model
          if (root && _.isFunction(root["get" + StringHelper.toInitialUpperCase(fieldName)])) {
            return await root["get" + StringHelper.toInitialUpperCase(fieldName)]()
          }
          if (root && root[fieldName] && (
              typeof root[fieldName] === 'number'
              || typeof root[fieldName] === 'string'
            )) {
            return await models[fieldType.name].findOne({where: {id: root[fieldName]}})
          }
          return root[fieldName]
        }
      })
    }
  }

  if (fieldType instanceof Connection.ConnectionType) {
    return {
      type: context.connectionType(fieldType.nodeType)
    }
  }

  if (fieldType instanceof Connection.EdgeType) {
    return {
      type: context.edgeType(fieldType.nodeType)
    }
  }

  if (fieldType instanceof Object) {
    if (fieldType['$type']) {
      const result = toGraphQLFieldConfig(name, postfix, fieldType["$type"], context)
      if (fieldType['enumValues']) {
        const values = {}
        fieldType['enumValues'].forEach(
          t => values[t] = {value: t}
        )
        result.type = new graphql.GraphQLEnumType({
          name: typeName(name) + postfix,
          values: values
        })
      }
      if (fieldType['required'] && !(result.type instanceof graphql.GraphQLNonNull)) {
        result.type = new graphql.GraphQLNonNull(result.type)
      }
      if (fieldType['resolve']) {
        result['resolve'] = fieldType['resolve']
      }
      if (fieldType['args']) {
        result['args'] = toGraphQLInputFieldMap(typeName(name), fieldType['args'])
      }
      result.description = fieldType['description']
      return result
    } else {
      return {
        type: new graphql.GraphQLObjectType({
          name: typeName(name) + postfix,
          interfaces: interfaces,
          fields: () => {
            const fields = {}
            _.forOwn(fieldType, (value, key) => {
              if (value['$type'] && value['hidden']) {
              } else {
                fields[key] = toGraphQLFieldConfig(name + postfix + "." + key, "", value, context)
              }
            })
            return fields
          }
        }),
        resolve: async function (root) {
          return root[name.split("\.").slice(-1)[0]]
        }
      }
    }
  }
  throw new Error("Unsupported type: " + fieldType)
}

export default toGraphQLFieldConfig