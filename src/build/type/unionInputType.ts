import {
  coerceInputValue,
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLScalarType,
  GraphQLString,
  ObjectValueNode,
  valueFromAST
} from 'graphql'
import _ from 'lodash'

const typeKey = 'variant'
const valueKey = 'value'

export default function unionInputType(options: {
  name: string
  inputValueTypes: {
    [key: string]: GraphQLInputType
  }
}): GraphQLScalarType {
  return new GraphQLScalarType({
    name: options.name,
    serialize: function (value) {
      return value
    },
    parseValue: function (inputValue: any) {
      if (inputValue) {
        const type = inputValue[typeKey]
        if (!type) {
          throw new GraphQLError(
            `${options.name}(UnionInputType): Missing typeKey ${typeKey} property'`
          )
        }
        const valueType = options.inputValueTypes[type]
        if (!valueType) {
          throw new GraphQLError(
            `${options.name}(UnionInputType): Invalid inputType ${type}'`
          )
        }

        if (inputValue[valueKey] == null) {
          return {
            [typeKey]: inputValue[typeKey],
            [valueKey]: inputValue[valueKey]
          }
        }

        const value = coerceInputValue(inputValue[valueKey], valueType)
        return {
          [typeKey]: inputValue[typeKey],
          [valueKey]: value
        }
      }
    },
    parseLiteral: function (ast) {
      let type
      try {
        if (ast.kind === 'ObjectValue') {
          const fields = ast.fields
          for (let i = 0; i < fields.length; i++) {
            if (fields[i].name.value === typeKey) {
              const value = fields[i].value
              if (value.kind === 'StringValue') {
                type = value.value
                break
              }
            }
          }
        }

        if (!type) {
          throw new Error(`Miss properties ${typeKey}`)
        }
      } catch (err) {
        throw new GraphQLError(
          `${options.name}(UnionInputType): Missing typeKey ${typeKey} property'`
        )
      }
      const valueType = options.inputValueTypes[type]
      if (!valueType) {
        throw new GraphQLError(
          `${options.name}(UnionInputType): Invalid inputType ${type}'`
        )
      }
      const inputType = new GraphQLInputObjectType({
        name: options.name,
        fields: function () {
          return {
            [typeKey]: {
              type: GraphQLString
            },
            [valueKey]: {
              type: valueType
            }
          }
        }
      })
      //if (isValidLiteralValue(inputType, ast).length === 0) {
      return valueFromAST(ast, inputType)
      // } else {
      //   throw new GraphQLError(
      //     `expected ${valueKey} type ${type}, found ${_.get(
      //       ast,
      //       'loc.source.body'
      //     ).substring(_.get(ast, 'loc.start'), _.get(ast, 'loc.end'))}`
      //   )
      // }
    }
  })
}
