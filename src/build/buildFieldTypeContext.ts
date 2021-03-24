import {
  ColumnFieldConfig,
  DataTypeConfig,
  InputFieldConfig,
  InterfaceContext,
  OutputFieldConfig,
  ResolverContext,
  TypeConfig,
  TypeContext
} from '../Definition'
import Schema from '../definition/Schema'
import {
  GraphQLFloat,
  GraphQLList,
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

type Context = ResolverContext & InterfaceContext

function buildModelType(
  schema: Schema,
  fieldTypeContext: TypeContext,
  context: Context
): TypeConfig {
  const typeName = schema.name
  return {
    name: typeName,
    description: schema.options.description,
    inputType: (fieldTypeContext.typeConfig(schema.name + 'Id') as any)
      .inputType,
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
                  config: value.config,
                  graphql: {
                    input: value.input,
                    dependentFields: value.dependentFields,
                    resolve: value.resolve
                  }
                }
              } as OutputFieldConfig
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
          const { type, id } = relay.fromGlobalId(root[fieldName])
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
          const { type, id } = relay.fromGlobalId(root[fieldName].id)
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
      let onDelete = options.metadata?.column?.onDelete || 'RESTRICT'
      let constraints = true
      if (options.metadata?.column?.constraints !== undefined) {
        constraints = options.metadata.column.constraints
        onDelete = undefined
      }

      if (options.nullable === false) {
        schema.belongsTo({
          [fieldName]: {
            target: typeName,
            hidden: true,
            foreignField: foreignField,
            foreignKey: { name: foreignField + 'Id', allowNull: false },
            onDelete: onDelete,
            constraints: constraints
          }
        })
      } else {
        schema.belongsTo({
          [fieldName]: {
            target: typeName,
            hidden: true,
            foreignField: foreignField,
            onDelete: onDelete,
            constraints: constraints
          }
        })
      }
      return null
    }
  }
}

function buildModelTypeId(
  schema: Schema,
  fieldTypeContext: TypeContext
): TypeConfig {
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
  dataTypeOptions: DataTypeConfig,
  fieldTypeContext: TypeContext,
  context: Context
): TypeConfig {
  const toOutputType = (name: string, options: OutputFieldConfig) => {
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

  const toInputType = (name, options: InputFieldConfig) => {
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
    columnOptions: (
      schema: Schema,
      fieldName: string,
      options: ColumnFieldConfig
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
          type: Sequelize.JSON
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
      }
    }
  }
}

function buildUnionWrapType(
  wrapType: string,
  fieldTypeContext: TypeContext,
  context: Context
): TypeConfig {
  const name = `_Union_${wrapType}`
  const typeConfig = fieldTypeContext.typeConfig(wrapType) as any
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
          resolve: typeConfig.outputResolve
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
  types: Array<TypeConfig>,
  dataTypes: Array<DataTypeConfig>,
  schemas: Array<Schema>,
  context: Context
) {
  const typeMap: { [key: string]: TypeConfig } = {}

  const resolves = [
    function resolveFunctionType(typeName) {
      if (typeof typeName !== 'string') {
        switch (typeName) {
          case Date:
            console.warn(
              "Field type name should be string. Please change Date to 'Date'."
            )
            return typeMap.Date
          case String:
            console.warn(
              "Field type name should be string. Please change String to 'String'."
            )
            return typeMap.String
          case Number:
            console.warn(
              "Field type name should be string. Please change Number to 'Number'."
            )
            return typeMap.Number
          case JSON:
            console.warn(
              "Field type name should be string. Please change JSON to 'JSON'."
            )
            return typeMap.JSON
          default:
            throw new Error(`Unknown type ${typeName}`)
        }
      }
    },
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
          return null
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
                    relay.fromGlobalId(root[fieldName][0].id).type ===
                      subTypeName))
              ) {
                const dbModel = sgContext.models[subTypeName]
                const ids = root[fieldName].map((r) => {
                  if (
                    typeof r === 'string' &&
                    relay.fromGlobalId(r).type === subTypeName
                  ) {
                    return relay.fromGlobalId(r).id
                  } else if (
                    r != null &&
                    typeof r.id === 'string' &&
                    relay.fromGlobalId(r.id).type === subTypeName
                  ) {
                    return relay.fromGlobalId(r.id).id
                  }
                  return r
                })
                const option = dbModel.resolveQueryOption({
                  info: info
                })
                const list = await (dbModel.withCache
                  ? dbModel.withCache()
                  : dbModel
                ).findAll({
                  where: { id: { [Sequelize.Op.in as any]: ids } },
                  include: option.include,
                  attributes: option.attributes
                })
                const result = []
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
          columnOptions: { type: Sequelize.JSON }
        }
      }
    },
    function resolveModelType(typeName) {
      const schema = schemas.find((s) => s.name === typeName)
      if (schema) {
        return buildModelType(schema, fieldTypeContext, context)
      }
    },
    function resolveModelIdType(typeName) {
      const schema = schemas.find((s) => s.name + 'Id' === typeName)
      if (schema) {
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
        if (!typeConfig) {
          return null
        }
        const connectionInfo = relay.connectionDefinitions({
          name: schema.name,
          nodeType: typeConfig.outputType as any,
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

  const fieldTypeContext: TypeContext = {
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
