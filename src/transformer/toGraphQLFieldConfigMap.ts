import _ from 'lodash'

import graphql, { GraphQLFieldConfig, GraphQLFieldConfigMap } from 'graphql'
import StringHelper from '../utils/StringHelper'
import { ColumnFieldOptionsType, FieldOptions, FieldOptionsType, FieldTypeContext, ResolverContext } from '../Definition'
import toGraphQLInputFieldConfigMap from './toGraphQLInputFieldConfigMap'

type Context = ResolverContext & FieldTypeContext;

const toGraphQLFieldConfigMap = function (name: string, postfix: string, fields: {
    [id: string]: FieldOptions;
}, context: Context): GraphQLFieldConfigMap<any, any> {
  const toTypeName = (name: string, path: string) => {
    return name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join('')
  }

  const fieldConfig = (fieldName: string, fieldPath: string, typeName: string): GraphQLFieldConfig<any, any> | null | undefined => {
    const fieldType = context.fieldType(typeName)
    if (!fieldType) {
      throw new Error(`Type "${typeName}" has not register for ${fieldName}.`)
    }
    if (fieldType.outputType) {
      const config: GraphQLFieldConfig<any, any> = {
        type: fieldType.outputType,
        args: toGraphQLInputFieldConfigMap(toTypeName(fieldName, fieldPath), fieldType.argFieldMap || {}, context)
      }
      const outputResolve = fieldType.outputResolve
      if (outputResolve) {
        config.resolve = context.hookFieldResolve(fieldPath, {
          $type: typeName,
          resolve: outputResolve
        })
      }
      return config
    } else {
      return null
    }
  }

  const convert = (name: string, path: string, field: any): GraphQLFieldConfig<any, any> | null | undefined => {
    if (typeof field === 'string' || typeof field === 'function') {
      return fieldConfig(name, path, field)
    }
    if (field instanceof Set) {
      return {
        type: new graphql.GraphQLEnumType({
          name: StringHelper.toInitialUpperCase(toTypeName(name, path)) + 'Input',
          values: _.fromPairs([...field].map(f => [f, { value: f, description: f }]))
        })
      }
    } else if (_.isArray(field)) {
      if (typeof field[0] === 'string' && context.fieldType(`[${field[0]}]`)) {
        return fieldConfig(name, path, `[${field[0]}]`)
      }

      const subField = convert(name, path, field[0])
      if (subField) {
        return {
          type: new graphql.GraphQLList(subField.type)
        }
      }
    }
    if (graphql.isOutputType(field)) {
      return { type: field }
    } else if (field instanceof Object) {
      if (field.$type) {
        const result = convert(name, path, field.$type)
        if (result) {
          result.description = field.description
          if (field.required) {
            if (!(result.type instanceof graphql.GraphQLNonNull)) {
              result.type = new graphql.GraphQLNonNull(result.type)
            }
          }
          if (field.resolve) {
            const finalField = { ...field }
            if (result.resolve) {
              const resolve = result.resolve
              finalField.resolve = async function (source, args, context, info, sgContext) {
                return resolve({
                  [info.fieldName]: await field.resolve(source, args, context, info, sgContext)
                }, args, context, info)
              }
            }
            result.resolve = context.hookFieldResolve(path, finalField)
          } else if (field.config != null) {
            // 性能优化:默认情况下不加hook
            result.resolve = result.resolve || context.hookFieldResolve(path, {
              ...field,
              resolve: async function (root, args, context, info) {
                return root[info.fieldName]
              }
            })
          }
          if (field.args) {
            result.args = { ...result.args, ...toGraphQLInputFieldConfigMap(toTypeName(name, path), field.args, context) }
          }
        }
        return result
      } else {
        if (_.keys(field).length > 0) {
          return {
            type: new graphql.GraphQLObjectType({
              name: StringHelper.toInitialUpperCase(toTypeName(name, path)) + postfix,
              fields: () => toGraphQLFieldConfigMap(toTypeName(name, path), postfix, field, context)
            }),
            resolve: context.hookFieldResolve(path, {
              $type: field,
              resolve: async function (root, args, context, info) {
                return root[info.fieldName]
              }
            })
          }
        }
      }
    }
    return null
  }

  const fieldMap: GraphQLFieldConfigMap<any, any> = {}

  _.forOwn(fields, (value, key) => {
    if ((<FieldOptionsType>value).$type && (<ColumnFieldOptionsType>value).hidden) { // Hidden field, ignore
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
