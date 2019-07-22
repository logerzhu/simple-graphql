// @flow
import type {
  ColumnFieldOptions,
  DataTypeOptions,
  FieldType,
  FieldTypeContext,
  InterfaceContext,
  ResolverContext
} from '../Definition'
import Schema from '../definition/Schema'
import innerFieldTypes from './fieldType'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import globalIdType from './fieldType/globalIdType'
import type { DefineAttributeColumnOptions } from 'sequelize'
import Sequelize from 'sequelize'
import _ from 'lodash'
import toGraphQLInputFieldConfigMap from '../transformer/toGraphQLInputFieldConfigMap'

type Context = ResolverContext & InterfaceContext

function buildModelType (schema: Schema, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
  const typeName = schema.name
  return {
    name: typeName,
    description: schema.config.options.description,
    inputType: (fieldTypeContext.fieldType(schema.name + 'Id'): any).inputType,
    outputType: new graphql.GraphQLObjectType({
      name: typeName,
      interfaces: [context.interface('Node')],
      fields: () => toGraphQLFieldConfigMap(typeName, '',
        {
          id: {
            $type: `Id`,
            required: true,
            resolve: async function (root) {
              return relay.toGlobalId(schema.name, root.id)
            }
          },
          ...schema.config.fields,
          ...schema.config.links
        },
        {
          hookFieldResolve: (name, options) => context.hookFieldResolve(name, options),
          hookQueryResolve: (name, options) => context.hookQueryResolve(name, options),
          hookMutationResolve: (name, options) => context.hookMutationResolve(name, options),
          fieldType: (typeName) => fieldTypeContext.fieldType(typeName)
        }
      )
    }),
    outputResolve: async function (root, args, context, info, sgContext) {
      const fieldName = info.fieldName
      if (root[fieldName]) {
        if (typeof root[fieldName] === 'string' || typeof root[fieldName] === 'number') {
          return sgContext.models[typeName].findOne({ where: { id: root[fieldName] } })
        } else {
          return root[fieldName]
        }
      } else if (root[fieldName + 'Id']) {
        return sgContext.models[typeName].findOne({ where: { id: root[fieldName + 'Id'] } })
      }
      return null
    },
    columnOptions: (schema, fieldName, options) => {
      let foreignField = fieldName
      let onDelete = 'RESTRICT'
      if (options && options.$type && options.column) {
        if (options.column.onDelete) {
          onDelete = options.column.onDelete
        }
      }
      if (options && options.$type && options.required) {
        schema.belongsTo({
          [fieldName]: {
            target: typeName,
            hidden: true,
            foreignField: foreignField,
            foreignKey: { name: foreignField + 'Id', allowNull: false },
            onDelete: onDelete,
            constraints: true
          }
        })
      } else {
        schema.belongsTo({
          [fieldName]: {
            target: typeName,
            hidden: true,
            foreignField: foreignField,
            onDelete: onDelete,
            constraints: true
          }
        })
      }
    }
  }
}

function buildModelTypeId (schema: Schema, fieldTypeContext: FieldTypeContext): FieldType {
  const typeName = schema.name + 'Id'
  const idType = globalIdType(schema.name)
  return {
    name: typeName,
    description: typeName,
    inputType: idType,
    outputType: idType
  }
}

function buildDataType (dataTypeOptions: DataTypeOptions, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
  let outputType = toGraphQLFieldConfigMap(dataTypeOptions.name, '', { '': dataTypeOptions.$type }, {
    hookFieldResolve: (name, options) => context.hookFieldResolve(name, options),
    hookQueryResolve: (name, options) => context.hookQueryResolve(name, options),
    hookMutationResolve: (name, options) => context.hookMutationResolve(name, options),
    fieldType: (typeName) => fieldTypeContext.fieldType(typeName)
  })[''].type

  let inputType = toGraphQLInputFieldConfigMap(dataTypeOptions.name, ({ '': dataTypeOptions.$type }: any), fieldTypeContext)[''].type
  return {
    name: dataTypeOptions.name,
    description: dataTypeOptions.description || dataTypeOptions.name,
    inputType: inputType,
    outputType: outputType,
    columnOptions: (schema: Schema, fieldName: string, options: ColumnFieldOptions) => {
      let typeName = dataTypeOptions
      if (dataTypeOptions && dataTypeOptions.$type) {
        typeName = dataTypeOptions.$type
      }

      let columnOptions: ?DefineAttributeColumnOptions = null
      if (typeName instanceof Set) {
        columnOptions = {
          type: Sequelize.STRING(191)
        }
      } else if (_.isArray(typeName)) {
        columnOptions = {
          type: Sequelize.JSON
        }
      } else if (typeof typeName === 'string') {
        const fieldType = fieldTypeContext.fieldType(typeName)
        if (!fieldType) {
          throw new Error(`Type "${typeName}" has not register.`)
        }
        if (!fieldType.columnOptions) {
          throw new Error(`Column type of "${typeName}" is not supported.`)
        }
        columnOptions = typeof fieldType.columnOptions === 'function' ? fieldType.columnOptions(schema, fieldName, options) : fieldType.columnOptions
      } else {
        columnOptions = {
          type: Sequelize.JSON
        }
      }
      if (columnOptions) {
        columnOptions = { ...columnOptions, ...(dataTypeOptions.columnOptions || {}) }
        if (options.$type != null && options.columnOptions != null) {
          columnOptions = { ...columnOptions, ...((options.columnOptions: any) || {}) }
        }
        return columnOptions
      }
    }
  }
}

export default function (fieldTypes: Array<FieldType>, dataTypes: Array<DataTypeOptions>, schemas: Array<Schema>, context: Context) {
  const typeMap = { ...innerFieldTypes }

  const fieldTypeContext: FieldTypeContext = {
    fieldType: (typeName) => {
      if (typeof typeName !== 'string') {
        switch (typeName) {
          case Date:
            typeName = 'Date'
            console.warn('Field type name should be string. Please change Date to \'Date\'.')
            break
          case String:
            typeName = 'String'
            console.warn('Field type name should be string. Please change String to \'String\'.')
            break
          case Number:
            typeName = 'Number'
            console.warn('Field type name should be string. Please change Number to \'Number\'.')
            break
          case JSON:
            typeName = 'JSON'
            console.warn('Field type name should be string. Please change JSON to \'JSON\'.')
            break
          default:
            throw new Error(`Unknown type ${typeName}`)
        }
      }
      if (!typeMap[typeName]) {
        if (typeName.endsWith('Interface')) {
          const gIntf = context.interface(typeName.substr(0, typeName.length - 'Interface'.length))
          if (gIntf) {
            typeMap[typeName] = {
              name: typeName,
              outputType: gIntf
            }
            return typeMap[typeName]
          }
        }
        if (typeName.startsWith('[') && typeName.endsWith(']')) {
          const subTypeName = typeName.substr(1, typeName.length - 2)
          const fieldType = fieldTypeContext.fieldType(subTypeName)
          if (!fieldType) {
            return null
          }
          typeMap[typeName] = {
            name: typeName,
            description: `Array of type ${subTypeName}`,
            inputType: fieldType.inputType ? new graphql.GraphQLList(fieldType.inputType) : null,
            outputType: fieldType.outputType ? new graphql.GraphQLList(fieldType.outputType) : null,
            outputResolve: async function (root, args, context, info, sgContext) {
              const fieldName = info.fieldName
              if (schemas.find(s => s.name === subTypeName) != null) {
                if (root[fieldName] != null && root[fieldName].length > 0 &&
                  (typeof root[fieldName][0] === 'string' || typeof root[fieldName][0] === 'number')) {
                  const list = await sgContext.models[subTypeName].findAll({
                    where: { id: { [(Sequelize.Op.in: any)]: root[fieldName] } }
                  })
                  const result = []
                  for (let id of root[fieldName]) {
                    const element = list.find(e => '' + e.id === '' + id)
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
          // TODO check Model array resolve
          return typeMap[typeName]
        }

        let schema = schemas.find(s => s.name === typeName)
        if (schema) {
          typeMap[typeName] = buildModelType(schema, fieldTypeContext, context)
          return typeMap[typeName]
        }

        schema = schemas.find(s => s.name + 'Id' === typeName)
        if (schema) {
          typeMap[typeName] = buildModelTypeId(schema, fieldTypeContext)
          return typeMap[typeName]
        }

        schema = schemas.find(s => s.name + 'Connection' === typeName || s.name + 'Edge' === typeName)
        if (schema) {
          const fieldType = fieldTypeContext.fieldType(schema.name)
          if (!fieldType) {
            return null
          }
          const connectionInfo = relay.connectionDefinitions({
            name: schema.name,
            nodeType: (fieldType.outputType: any),
            connectionFields: {
              count: {
                type: graphql.GraphQLFloat
              }
            }
          })
          typeMap[schema.name + 'Connection'] = {
            name: schema.name + 'Connection',
            description: schema.name + 'Connection',
            argFieldMap: {
              after: 'String',
              first: 'Number',
              before: 'String',
              last: 'Number'
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
      }
      return typeMap[typeName]
    }
  }

  fieldTypes.forEach(f => {
    typeMap[f.name] = f
  })
  dataTypes.forEach(d => {
    typeMap[d.name] = buildDataType(d, fieldTypeContext, context)
  })
  return fieldTypeContext
}
