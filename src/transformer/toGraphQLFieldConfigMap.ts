import _ from 'lodash'

import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType
} from 'graphql'
import StringHelper from '../utils/StringHelper'
import toGraphQLInputFieldConfigMap from './toGraphQLInputFieldConfigMap'
import {
  SGLinkedFieldConfig,
  SGOutputFieldConfig,
  SGResolverContext,
  SGTypeContext
} from '..'

type Context = SGResolverContext & SGTypeContext

const toGraphQLFieldConfigMap = function (
  name: string,
  postfix: string,
  fields: {
    [id: string]: SGOutputFieldConfig
  },
  context: Context
): GraphQLFieldConfigMap<any, any> {
  const toTypeName = (name: string, path: string) => {
    return (
      name +
      path
        .split('.')
        .map((v) => StringHelper.toInitialUpperCase(v))
        .join('')
    )
  }

  const fieldConfig = (
    fieldName: string,
    fieldPath: string,
    typeName: string
  ): GraphQLFieldConfig<any, any> | undefined => {
    const typeConfig = context.typeConfig(typeName)
    if (!typeConfig) {
      throw new Error(`Type "${typeName}" has not register for ${fieldName}.`)
    }
    if (typeConfig.outputType) {
      const config: GraphQLFieldConfig<any, any> = {
        type: typeConfig.outputType,
        args: toGraphQLInputFieldConfigMap(
          toTypeName(fieldName, fieldPath),
          typeConfig.additionalInput || {},
          context
        )
      }
      const outputResolve = typeConfig.outputResolve
      if (outputResolve) {
        config.resolve = context.hookFieldResolve(fieldPath, {
          output: { type: typeName },
          resolve: outputResolve
        })
      }
      return config
    } else {
      return undefined
    }
  }

  const convert = (
    name: string,
    path: string,
    field: SGOutputFieldConfig
  ): GraphQLFieldConfig<any, any> | null => {
    const makeNonNull = function (
      config: GraphQLFieldConfig<any, any> | undefined
    ) {
      if (config == null) {
        return null
      }

      if (
        field.nullable === false &&
        !(config.type instanceof GraphQLNonNull)
      ) {
        config.type = new GraphQLNonNull(config.type)
      }

      config.description = field.metadata?.description
      const finalField: SGLinkedFieldConfig = {
        description: config.description,
        hookOptions: field.metadata?.hookOptions,
        input: field.metadata?.graphql?.input,
        dependentFields: field.metadata?.graphql?.dependentFields,
        output: field,
        resolve: async function (root, args, context, info) {
          return root[info.fieldName]
        }
      }

      if (field.metadata?.graphql?.resolve) {
        const cusResolve = field.metadata.graphql.resolve
        if (config.resolve) {
          const resolve = config.resolve
          finalField.resolve = async function (
            source,
            args,
            context,
            info,
            sgContext
          ) {
            return resolve(
              {
                [info.fieldName]: await cusResolve(
                  source,
                  args,
                  context,
                  info,
                  sgContext
                )
              },
              args,
              context,
              info
            )
          }
        } else {
          finalField.resolve = cusResolve
        }
        config.resolve = context.hookFieldResolve(path, finalField)
      } else {
        // 性能优化:默认情况下不加hook
        config.resolve =
          config.resolve || context.hookFieldResolve(path, finalField)
      }

      if (field.metadata?.graphql?.input) {
        config.args = {
          ...config.args,
          ...toGraphQLInputFieldConfigMap(
            toTypeName(name, path),
            field.metadata?.graphql?.input,
            context
          )
        }
      }
      return config
    }

    if (field.type) {
      return makeNonNull(fieldConfig(name, path, field.type))
    } else if (field.enum) {
      return makeNonNull({
        type: new GraphQLEnumType({
          name:
            StringHelper.toInitialUpperCase(toTypeName(name, path)) + postfix,
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
        return makeNonNull(fieldConfig(name, path, `[${field.elements.type}]`))
      } else {
        const subField = convert(name, path, field.elements)
        if (subField) {
          return makeNonNull({
            type: new GraphQLList(subField.type)
          })
        }
      }
    } else if (field.properties) {
      if (_.keys(field.properties).length > 0) {
        return makeNonNull({
          type: new GraphQLObjectType({
            name:
              StringHelper.toInitialUpperCase(toTypeName(name, path)) + postfix,
            fields: () =>
              toGraphQLFieldConfigMap(
                toTypeName(name, path),
                postfix,
                field.properties,
                context
              )
          }),
          resolve: context.hookFieldResolve(path, {
            output: field,
            resolve: async function (root, args, context, info) {
              return root[info.fieldName]
            }
          })
        })
      }
    } else if (field.values) {
      //TODO
    } else if (field.mapping) {
      //TODO 支持嵌套定义
      const unionTypes = _.mapValues(
        field.mapping,
        (value, key) => context.typeConfig(`_Union_${value.type}`)?.outputType
      )
      return makeNonNull({
        type: new GraphQLUnionType({
          name:
            StringHelper.toInitialUpperCase(toTypeName(name, path)) + postfix,
          types: _.uniq(_.values(unionTypes)) as any, //TODO 需要 Object Type
          resolveType(value) {
            if (value && value[field.discriminator]) {
              return (context.typeConfig(
                `_Union_${field.mapping[value[field.discriminator]].type}` // TODO 支持嵌套定义
              ) as any).outputType
            }
          }
        })
      })
      //TODO
    }
    return null
  }

  const fieldMap: GraphQLFieldConfigMap<any, any> = {}

  _.forOwn(fields, (value, key) => {
    if (value.metadata?.graphql?.hidden) {
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
