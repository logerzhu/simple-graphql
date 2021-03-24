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
import { TypeContext, InputFieldConfig } from '../Definition'

import unionInputType from '../build/fieldType/unionInputType'

const toGraphQLInputFieldConfigMap = function (
  name: string,
  fields: {
    [id: string]: InputFieldConfig
  },
  context: TypeContext
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

  const convert = (
    name: string,
    path: string,
    field: InputFieldConfig
  ): GraphQLInputFieldConfig | null => {
    const makeNonNull = function (config: GraphQLInputFieldConfig | null) {
      if (config == null) {
        return null
      }
      config.description = field.metadata?.description
      if (field.metadata?.graphql?.defaultValue) {
        config.defaultValue = field.metadata?.graphql?.defaultValue
        config.description = `${config.description || ''}  默认值: ${
          config.defaultValue
        }`
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
        context.fieldType(`[${field.elements.type}]`)
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
            (options, key) => inputFieldConfig(options.type).type //TODO 支持嵌套类型
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
