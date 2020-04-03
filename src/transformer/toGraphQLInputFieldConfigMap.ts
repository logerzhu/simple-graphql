import _ from 'lodash'

import {
  GraphQLEnumType,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  isInputType
} from 'graphql'
import StringHelper from '../utils/StringHelper'
import {
  ColumnFieldOptionsType,
  FieldOptionsType,
  FieldTypeContext,
  InputFieldOptions,
  InputFieldOptionsType
} from '../Definition'

const toGraphQLInputFieldConfigMap = function (name: string, fields: {
  [id: string]: InputFieldOptions;
}, context: FieldTypeContext): GraphQLInputFieldConfigMap {
  const toTypeName = (name: string, path: string) => {
    return name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join('')
  }

  const inputFieldConfig = (typeName): GraphQLInputFieldConfig | null | undefined => {
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

  const convert = (name: string, path: string, field: any): GraphQLInputFieldConfig | null | undefined => {
    if (typeof field === 'string' || typeof field === 'function') {
      return inputFieldConfig(field)
    }
    if (field instanceof Set) {
      return {
        type: new GraphQLEnumType({
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
          type: new GraphQLList(subField.type)
        }
      }
    } else if (isInputType(field)) {
      return { type: field }
    } else if (field instanceof Object) {
      if (field.$type) {
        const result = convert(name, path, field.$type)
        if (result) {
          result.description = field.description
          if (field.default != null && !_.isFunction(field.default)) {
            result.defaultValue = field.default
            result.description = (result.description ? result.description : '') + ' 默认值:' + result.defaultValue
          }
          if (field.required) {
            if (!(result.type instanceof GraphQLNonNull)) {
              result.type = new GraphQLNonNull(result.type)
            }
          }
        }
        return result
      } else {
        if (_.keys(field).length > 0) {
          return {
            type: new GraphQLInputObjectType({
              name: StringHelper.toInitialUpperCase(toTypeName(name, path)) + 'Input',
              fields: () => toGraphQLInputFieldConfigMap(toTypeName(name, path), field, context)
            })
          }
        }
      }
    }
    return null
  }

  const fieldMap: GraphQLInputFieldConfigMap = {}

  _.forOwn(fields, (value, key) => {
    if ((<InputFieldOptionsType>value).$type && ((<ColumnFieldOptionsType>value).hidden || (<FieldOptionsType>value).resolve)) { // Hidden field, ignore
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
