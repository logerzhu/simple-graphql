// @flow

import _ from 'lodash'

import type { GraphQLInputFieldConfig, GraphQLInputFieldConfigMap } from 'graphql'
import * as graphql from 'graphql'
import StringHelper from '../utils/StringHelper'
import type { FieldTypeContext, InputFieldOptions } from '../Definition'

const toGraphQLInputFieldConfigMap = function (
  name: string,
  fields: { [id: string]: InputFieldOptions },
  context: FieldTypeContext): GraphQLInputFieldConfigMap {
  const toTypeName = (name: string, path: string) => {
    return name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join('')
  }

  const inputFieldConfig = (typeName): ?GraphQLInputFieldConfig => {
    const fieldType = context.fieldType(typeName)
    if (!fieldType) {
      throw new Error(`Type "${typeName}" has not register.`)
    }
    if (fieldType.inputType) {
      return { type: fieldType.inputType }
    } else {
      return null
    }
  }

  const convert = (name: string,
    path: string,
    field: any): ?GraphQLInputFieldConfig => {
    if (typeof field === 'string') {
      return inputFieldConfig(field)
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
        return inputFieldConfig(`[${field[0]}]`)
      }

      const subField = convert(name, path, field[0])
      if (subField) {
        return {
          type: new graphql.GraphQLList(subField.type)
        }
      }
    } else if (field instanceof Object) {
      if (field.$type) {
        let result = convert(name, path, field.$type)
        if (result) {
          result.description = field['description']
          if (field['default'] != null && !_.isFunction(field['default'])) {
            result.defaultValue = field['default']
            result.description = (result.description ? result.description : '') + ' 默认值:' + result.defaultValue
          }
          if (field['required']) {
            if (!(result.type instanceof graphql.GraphQLNonNull)) {
              result.type = new graphql.GraphQLNonNull(result.type)
            }
          }
        }
        return result
      } else {
        const subFields = toGraphQLInputFieldConfigMap(toTypeName(name, path), field, context)
        if (_.keys(subFields).length > 0) {
          return {
            type: new graphql.GraphQLInputObjectType({
              name: StringHelper.toInitialUpperCase(toTypeName(name, path)) + 'Input',
              fields: subFields
            })
          }
        }
      }
    }
    return null
  }

  const fieldMap: GraphQLInputFieldConfigMap = {}

  _.forOwn(fields, (value, key) => {
    if (value.$type && (value['hidden'] || value['resolve'])) {
      // Hidden field, ignore
      // Have resolve method, ignore
    } else {
      const inputFieldConfig = convert(name, key, value)
      if (inputFieldConfig) {
        fieldMap[key] = inputFieldConfig
      }
    }
  })
  return fieldMap
}

export default toGraphQLInputFieldConfigMap
