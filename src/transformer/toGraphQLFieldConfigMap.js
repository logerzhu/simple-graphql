// @flow

import _ from 'lodash'

import type { GraphQLFieldConfig, GraphQLFieldConfigMap } from 'graphql'
import * as graphql from 'graphql'
import StringHelper from '../utils/StringHelper'
import type { FieldOptions, FieldResolve, FieldTypeContext, ResolverContext } from '../Definition'
import toGraphQLInputFieldConfigMap from './toGraphQLInputFieldConfigMap'

const toGraphQLFieldConfigMap = function (
  name: string,
  postfix: string,
  fields: { [id: string]: FieldOptions },
  context: ResolverContext & FieldTypeContext): GraphQLFieldConfigMap<any, any> {
  const toTypeName = (name: string, path: string) => {
    return name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join('')
  }

  const fieldConfig = (fieldName: string, fieldPath: string, typeName: string): ?GraphQLFieldConfig<any, any> => {
    const fieldType = context.fieldType(typeName)
    if (!fieldType) {
      throw new Error(`Type "${typeName}" has not register.`)
    }
    if (fieldType.outputType) {
      const config: GraphQLFieldConfig<any, any> = {
        type: fieldType.outputType,
        args: toGraphQLInputFieldConfigMap(toTypeName(fieldName, fieldPath), fieldType.argFieldMap || {}, context)
      }
      if (fieldType.outputResolve) {
        config.resolve = context.hookFieldResolve(fieldName.split('.').slice(-1)[0], {
          $type: typeName,
          resolve: (fieldType.outputResolve: FieldResolve)
        })
      }
      return config
    } else {
      return null
    }
  }

  const convert = (name: string,
    path: string,
    field: any): ?GraphQLFieldConfig<any, any> => {
    if (typeof field === 'string') {
      return fieldConfig(name, path, field)
    }

    if (_.isArray(field)) {
      if (typeof field[0] === 'string' && context.fieldType(`[${field[0]}]`)) {
        return fieldConfig(name, path, `[${field[0]}]`)
      }

      const subField = convert(name, path, field[0])
      if (subField) {
        // TODO how to handle element resolve
        return {
          type: new graphql.GraphQLList(subField.type)
        }
      }
    } else if (field instanceof Object) {
      if (field.$type) {
        let result = convert(name, path, field.$type)
        if (result) {
          result.description = field['description']
          if (field['required']) {
            if (!(result.type instanceof graphql.GraphQLNonNull)) {
              result.type = new graphql.GraphQLNonNull(result.type)
            }
          }
          if (field['resolve']) {
            result['resolve'] = context.hookFieldResolve(name.split('.').slice(-1)[0], field)
          }
          if (field.args) {
            result.args = { ...result.args, ...toGraphQLInputFieldConfigMap(toTypeName(name, path), field.args, context) }
          }
        }
        return result
      } else {
        const subFields = toGraphQLFieldConfigMap(toTypeName(name, path), postfix, field, context)
        if (_.keys(subFields).length > 0) {
          return {
            type: new graphql.GraphQLObjectType({
              name: StringHelper.toInitialUpperCase(toTypeName(name, path)) + postfix,
              fields: subFields
            }),
            resolve: context.hookFieldResolve(name.split('.').slice(-1)[0], {
              $type: field,
              resolve: async function (root) {
                return root[name.split('.').slice(-1)[0]]
              }
            }
            )
          }
        }
      }
    }
    return null
  }

  const fieldMap: GraphQLFieldConfigMap<any, any> = {}

  _.forOwn(fields, (value, key) => {
    if (value.$type && value['hidden']) {
      // Hidden field, ignore
      // Have resolve method, ignore
    } else {
      const fieldConfig = convert(name, key, value)
      if (fieldConfig) {
        fieldMap[key] = fieldConfig
      }
    }
  })
  return fieldMap
}

export default toGraphQLFieldConfigMap
