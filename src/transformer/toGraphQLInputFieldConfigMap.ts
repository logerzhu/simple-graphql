import _ from 'lodash'

import {
  GraphQLEnumType,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull
} from 'graphql'
import StringHelper from '../utils/StringHelper'

import unionInputType from '../build/type/unionInputType'
import { SGInputFieldConfig, SGTypeContext } from '../index'

const toGraphQLInputFieldConfigMap = function (
  name: string,
  fields: {
    [id: string]: SGInputFieldConfig
  },
  context: SGTypeContext
): GraphQLInputFieldConfigMap {
  const toTypeName = (name: string, path: string) => {
    return (
      name +
      path
        .split('.')
        .map((v) => StringHelper.toInitialUpperCase(v))
        .join('')
    )
  }

  const inputFieldConfig = (typeName): GraphQLInputFieldConfig | null => {
    const typeConfig = context.typeConfig(typeName)
    if (!typeConfig) {
      throw new Error(`Type "${typeName}" has not register.`)
    }
    if (typeConfig.inputType) {
      return { type: typeConfig.inputType }
    } else {
      return null
    }
  }

  const convert = (
    name: string,
    path: string,
    field: SGInputFieldConfig
  ): GraphQLInputFieldConfig | null => {
    const makeNonNull = function (config: GraphQLInputFieldConfig | null) {
      if (config == null) {
        return null
      }
      config.description = field.metadata?.description
      if (typeof field.metadata?.graphql?.defaultValue !== 'function') {
        config.defaultValue = field.metadata?.graphql?.defaultValue
      }

      if (
        field.nullable === false &&
        !(config.type instanceof GraphQLNonNull)
      ) {
        config.type = new GraphQLNonNull(config.type)
      }
      return config
    }

    if (field.type) {
      return makeNonNull(inputFieldConfig(field.type))
    } else if (field.enum) {
      return makeNonNull({
        type: new GraphQLEnumType({
          name:
            StringHelper.toInitialUpperCase(toTypeName(name, path)) + 'Input',
          values: _.fromPairs(
            [...field.enum].map((f) => [f, { value: f, description: f }])
          )
        })
      })
    } else if (field.elements) {
      if (
        field.elements.type &&
        context.typeConfig(`[${field.elements.type}]`)
      ) {
        return makeNonNull(inputFieldConfig(`[${field.elements.type}]`))
      }

      const subField = convert(name, path, field.elements)
      if (subField) {
        return makeNonNull({
          type: new GraphQLList(subField.type)
        })
      }
    }
    if (field.properties) {
      if (_.keys(field.properties).length > 0) {
        return makeNonNull({
          type: new GraphQLInputObjectType({
            name:
              StringHelper.toInitialUpperCase(toTypeName(name, path)) + 'Input',
            fields: () =>
              toGraphQLInputFieldConfigMap(
                toTypeName(name, path),
                field.properties,
                context
              )
          })
        })
      }
    } else if (field.values) {
      //TODO
    } else if (field.mapping) {
      //TODO
      return makeNonNull({
        type: unionInputType({
          name:
            StringHelper.toInitialUpperCase(toTypeName(name, path)) + 'Input',
          inputValueTypes: _.mapValues(
            field.mapping,
            (options, key) => {
              const inputType = inputFieldConfig(options.type)
              if (inputType) {
                return inputType.type
              } else {
                throw new Error(`类型 ${options.type} 没有InputType配置`)
              }
            } //TODO 支持嵌套类型
          )
        })
      })
    }
    return null
  }

  const fieldMap: GraphQLInputFieldConfigMap = {}

  _.forOwn(fields, (value, key) => {
    if (value.metadata?.graphql?.hidden) {
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
