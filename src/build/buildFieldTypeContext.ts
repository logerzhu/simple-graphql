import { SequelizeSGSchema } from '../definition/SequelizeSGSchema'
import {
  GraphQLFloat,
  GraphQLList,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import * as relay from 'graphql-relay'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import globalIdType from './type/globalIdType'
import Sequelize, { ModelAttributeColumnOptions } from 'sequelize'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'
import innerFieldTypes from './type'
import innerDataTypes from './dataType'
import _ from 'lodash'
import {
  SGColumnFieldConfig,
  SGDataTypeConfig,
  SGInputFieldConfig,
  SGInterfaceContext,
  SGOutputFieldConfig,
  SGResolverContext,
  SGModel,
  SGTypeConfig,
  SGTypeContext
} from '..'
import StringHelper from '../utils/StringHelper'
import { SGSchema } from '../definition/SGSchema'

type Context = SGResolverContext & SGInterfaceContext

function buildModelType(
  schema: SequelizeSGSchema,
  fieldTypeContext: SGTypeContext,
  context: Context
): SGTypeConfig {
  const typeName = schema.name
  return {
    name: typeName,
    description: schema.options.description,
    inputType: fieldTypeContext.typeConfig(schema.name + 'Id')?.inputType,
    outputType: new GraphQLObjectType({
      name: typeName,
      interfaces: [context.interface('Node')],
      fields: () =>
        toGraphQLFieldConfigMap(
          typeName,
          '',
          {
            id: {
              type: 'Id',
              nullable: false,
              metadata: {
                graphql: {
                  resolve: async function (root) {
                    return relay.toGlobalId(schema.name, root.id)
                  }
                }
              }
            },
            ...schema.config.fields,
            ..._.mapValues(schema.config.links, (value, key) => {
              return {
                ...value.output,
                metadata: {
                  description:
                    value.description || value.output.metadata?.description,
                  hookOptions: value.hookOptions,
                  graphql: {
                    input: value.input,
                    dependentFields: value.dependentFields,
                    resolve: value.resolve
                  }
                }
              } as SGOutputFieldConfig
            })
          },
          {
            hookFieldResolve: (name, options) =>
              context.hookFieldResolve(name, options),
            hookQueryResolve: (name, options) =>
              context.hookQueryResolve(name, options),
            hookMutationResolve: (name, options) =>
              context.hookMutationResolve(name, options),
            typeConfig: (typeName) => fieldTypeContext.typeConfig(typeName)
          }
        )
    }),
    outputResolve: async function (root, args, context, info, sgContext) {
      const fieldName = info.fieldName
      if (root[fieldName]) {
        if (typeof root[fieldName] === 'string') {
          const { type, id } = StringHelper.fromGlobalId(root[fieldName])
          if (type === typeName) {
            return sgContext.models[typeName].findByPkForGraphQL(
              id,
              {},
              context,
              info
            )
          } else {
            return sgContext.models[typeName].findByPkForGraphQL(
              root[fieldName],
              {},
              context,
              info
            )
          }
        } else if (typeof root[fieldName] === 'number') {
          return sgContext.models[typeName].findByPkForGraphQL(
            root[fieldName],
            {},
            context,
            info
          )
        } else if (typeof root[fieldName].id === 'string') {
          const { type, id } = StringHelper.fromGlobalId(root[fieldName].id)
          if (type === typeName) {
            return sgContext.models[typeName].findByPkForGraphQL(
              id,
              {},
              context,
              info
            )
          } else {
            return root[fieldName]
          }
        } else {
          return root[fieldName]
        }
      } else if (root[fieldName + 'Id']) {
        return sgContext.models[typeName].findByPkForGraphQL(
          root[fieldName + 'Id'],
          {},
          context,
          info
        )
      }
      return null
    },
    columnOptions: (schema, fieldName, options) => {
      const foreignField = fieldName
      let onDelete: string | undefined =
        options.metadata?.column?.onDelete || 'RESTRICT'
      let constraints = true
      if (options.metadata?.column?.constraints !== undefined) {
        constraints = options.metadata.column.constraints
        onDelete = undefined
      }

      schema.belongsTo({
        [fieldName]: {
          target: typeName,
          hidden: true,
          foreignField: foreignField,
          foreignKey: {
            name: options.metadata?.column?.field || foreignField + 'Id',
            allowNull: options.nullable !== false
          },
          targetKey: options.metadata?.column?.targetKey,
          onDelete: onDelete,
          constraints: constraints
        }
      })
      return null
    }
  }
}

function buildModelTypeId(
  schema: SequelizeSGSchema,
  fieldTypeContext: SGTypeContext
): SGTypeConfig {
  const typeName = schema.name + 'Id'
  const idType = globalIdType(schema.name)
  return {
    name: typeName,
    description: typeName,
    inputType: idType,
    outputType: idType
  }
}

function buildDataType(
  dataTypeOptions: SGDataTypeConfig,
  fieldTypeContext: SGTypeContext,
  context: Context
): SGTypeConfig {
  const toOutputType = (name: string, options: SGOutputFieldConfig) => {
    const outputConfigMap = toGraphQLFieldConfigMap(
      name,
      '',
      { '': options },
      {
        hookFieldResolve: (name, options) =>
          context.hookFieldResolve(name, options),
        hookQueryResolve: (name, options) =>
          context.hookQueryResolve(name, options),
        hookMutationResolve: (name, options) =>
          context.hookMutationResolve(name, options),
        typeConfig: (typeName) => fieldTypeContext.typeConfig(typeName)
      }
    )['']
    return outputConfigMap && outputConfigMap.type
  }

  const toInputType = (name, options: SGInputFieldConfig) => {
    const inputConfigMap = toGraphQLInputFieldConfigMap(
      name,
      { '': options },
      fieldTypeContext
    )['']
    return inputConfigMap && inputConfigMap.type
  }

  let outputType, inputType
  outputType = toOutputType(dataTypeOptions.name, dataTypeOptions.definition)
  inputType = toInputType(dataTypeOptions.name, dataTypeOptions.definition)
  return {
    name: dataTypeOptions.name,
    description: dataTypeOptions.description || dataTypeOptions.name,
    inputType: inputType,
    outputType: outputType,
    outputResolve: dataTypeOptions.definition.metadata?.graphql?.resolve,
    columnOptions: (
      schema: SequelizeSGSchema,
      fieldName: string,
      options: SGColumnFieldConfig
    ) => {
      let columnOptions: ModelAttributeColumnOptions | null = null
      const definition = dataTypeOptions.definition
      if (definition.type) {
        const typeConfig = fieldTypeContext.typeConfig(definition.type)
        if (!typeConfig) {
          throw new Error(`Type "${definition.type}" has not register.`)
        }
        if (!typeConfig.columnOptions) {
          throw new Error(
            `Column type of "${definition.type}" is not supported.`
          )
        }
        columnOptions =
          typeof typeConfig.columnOptions === 'function'
            ? typeConfig.columnOptions(schema, fieldName, options)
            : typeConfig.columnOptions
      } else if (definition.enum) {
        columnOptions = {
          type: Sequelize.STRING(191)
        }
      } else if (definition.elements) {
        columnOptions = {
          type: Sequelize.JSONB
        }
      } else {
        columnOptions = {
          type: Sequelize.JSON
        }
      }

      if (columnOptions) {
        columnOptions = {
          ...columnOptions,
          ...(dataTypeOptions.columnOptions || {})
        }
        if (options?.metadata?.column) {
          columnOptions = {
            ...columnOptions,
            ...options?.metadata?.column
          }
        }
        return columnOptions
      } else {
        return null
      }
    }
  }
}

function buildUnionWrapType(
  wrapType: string,
  fieldTypeContext: SGTypeContext,
  context: Context
): SGTypeConfig {
  const name = `_Union_${wrapType}`
  const typeConfig = fieldTypeContext.typeConfig(wrapType)
  if (!typeConfig?.outputType) {
    throw new Error(`Type ${wrapType} has not register`)
  }
  return {
    name: name,
    description: `Union wrap type for ${wrapType}`,
    inputType: null,
    outputType: new GraphQLObjectType({
      name: name,
      fields: {
        variant: { type: GraphQLString },
        value: {
          type: typeConfig.outputType,
          resolve: typeConfig?.outputResolve
            ? context.hookFieldResolve('value', {
                output: { type: wrapType },
                resolve: typeConfig.outputResolve
              })
            : undefined
        }
      }
    }),
    columnOptions: { type: Sequelize.JSON }
  }
}

export default function (
  types: Array<SGTypeConfig>,
  dataTypes: Array<SGDataTypeConfig>,
  schemas: Array<SGSchema>,
  context: Context
) {
  const typeMap: { [key: string]: SGTypeConfig } = {}

  const resolves: Array<(string) => SGTypeConfig | undefined> = [
    function resolveInterfaceType(typeName) {
      if (typeName.endsWith('Interface')) {
        const gIntf = context.interface(
          typeName.substr(0, typeName.length - 'Interface'.length)
        )
        if (gIntf) {
          return {
            name: typeName,
            outputType: gIntf
          }
        }
      }
    },
    function resolveArrayType(typeName) {
      if (typeName.startsWith('[') && typeName.endsWith(']')) {
        const subTypeName = typeName.substr(1, typeName.length - 2)
        const typeConfig = fieldTypeContext.typeConfig(subTypeName)
        if (!typeConfig) {
          return undefined
        }
        return {
          name: typeName,
          description: `Array of type ${subTypeName}`,
          inputType: typeConfig.inputType
            ? new GraphQLList(typeConfig.inputType)
            : null,
          outputType: typeConfig.outputType
            ? new GraphQLList(typeConfig.outputType)
            : null,
          outputResolve: async function (root, args, context, info, sgContext) {
            const fieldName = info.fieldName
            if (schemas.find((s) => s.name === subTypeName) != null) {
              if (
                root[fieldName] != null &&
                root[fieldName].length > 0 &&
                (typeof root[fieldName][0] === 'string' ||
                  typeof root[fieldName][0] === 'number' ||
                  (root[fieldName][0] != null &&
                    typeof root[fieldName][0].id === 'string' &&
                    StringHelper.fromGlobalId(root[fieldName][0].id).type ===
                      subTypeName))
              ) {
                const dbModel = sgContext.models[subTypeName]
                const ids = root[fieldName].map((r) => {
                  if (
                    typeof r === 'string' &&
                    StringHelper.fromGlobalId(r).type === subTypeName
                  ) {
                    return StringHelper.fromGlobalId(r).id
                  } else if (
                    r != null &&
                    typeof r.id === 'string' &&
                    StringHelper.fromGlobalId(r.id).type === subTypeName
                  ) {
                    return StringHelper.fromGlobalId(r.id).id
                  }
                  return r
                })
                const option = dbModel.resolveQueryOption({
                  info: info
                })
                const list = dbModel.withCache
                  ? await dbModel.withCache().findAll({
                      where: { id: { [Sequelize.Op.in]: ids } },
                      include: option.include,
                      attributes: option.attributes
                    })
                  : await dbModel.findAll({
                      where: { id: { [Sequelize.Op.in]: ids } },
                      include: option.include,
                      attributes: option.attributes
                    })
                const result: SGModel[] = []
                for (const id of ids) {
                  const element = list.find((e) => '' + e.id === '' + id)
                  if (element) {
                    result.push(element)
                  }
                }
                return result
              }
            }
            return root[fieldName]
          },
          columnOptions: { type: Sequelize.JSONB }
        }
      }
    },
    function resolveModelType(typeName) {
      const schema = schemas.find((s) => s.name === typeName)
      if (schema instanceof SequelizeSGSchema) {
        return buildModelType(schema, fieldTypeContext, context)
      }
    },
    function resolveModelIdType(typeName) {
      const schema = schemas.find((s) => s.name + 'Id' === typeName)
      if (schema instanceof SequelizeSGSchema) {
        return buildModelTypeId(schema, fieldTypeContext)
      }
    },
    function resolveModelConnectionType(typeName) {
      const schema = schemas.find(
        (s) =>
          s.name + 'Connection' === typeName || s.name + 'Edge' === typeName
      )
      if (schema) {
        const typeConfig = fieldTypeContext.typeConfig(schema.name)
        if (!typeConfig?.outputType) {
          return undefined
        }
        const connectionInfo = relay.connectionDefinitions({
          name: schema.name,
          nodeType: typeConfig.outputType as GraphQLNamedType,
          connectionFields: {
            count: {
              type: GraphQLFloat
            }
          }
        })
        typeMap[schema.name + 'Connection'] = {
          name: schema.name + 'Connection',
          description: schema.name + 'Connection',
          additionalInput: {
            after: { type: 'String' },
            first: { type: 'Number' },
            before: { type: 'String' },
            last: { type: 'Number' }
          },
          inputType: undefined,
          outputType: connectionInfo.connectionType
        }
        typeMap[schema.name + 'Edge'] = {
          name: schema.name + 'Edge',
          description: schema.name + 'Edge',
          inputType: undefined,
          outputType: connectionInfo.edgeType
        }
        return typeMap[typeName]
      }
    },
    function resolveUnionWrapType(typeName) {
      if (typeName.startsWith('_Union_')) {
        return buildUnionWrapType(
          typeName.substr('_Union_'.length),
          fieldTypeContext,
          context
        )
      }
    }
  ]

  const fieldTypeContext: SGTypeContext = {
    typeConfig: (typeName) => {
      if (typeMap[typeName]) {
        return typeMap[typeName]
      }
      for (const resolve of resolves) {
        const type = resolve(typeName)
        if (type) {
          typeMap[type.name] = type
          return type
        }
      }
      return null
    }
  }

  for (const f of [...innerFieldTypes, ...types]) {
    typeMap[f.name] = f
  }

  for (const d of [...innerDataTypes, ...dataTypes]) {
    typeMap[d.name] = buildDataType(d, fieldTypeContext, context)
  }

  return fieldTypeContext
}
