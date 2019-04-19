// @flow
import type { FieldType, FieldTypeContext, InterfaceContext, ResolverContext } from '../Definition'
import Schema from '../definition/Schema'
import innerFieldTypes from './fieldType'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import globalIdType from './fieldType/globalIdType'
import Sequelize from 'sequelize'

type Context = ResolverContext & InterfaceContext

function buildModelType (schema: Schema, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
  const typeName = schema.name
  return {
    name: typeName,
    description: schema.config.options.description,
    inputType: (fieldTypeContext.fieldType(schema.name + 'Id'): any).inputType,
    outputType: new graphql.GraphQLObjectType({
      name: typeName,
      interfaces: [context.interface('node')],
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
    // outputResolve?: toGraphQLInputFieldConfigMap(),
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

function buildModelTypeId (schema: Schema, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
  const typeName = schema.name + 'Id'
  const idType = globalIdType(schema.name)
  return {
    name: typeName,
    description: typeName,
    inputType: idType,
    outputType: idType
  }
}

export default function (fieldTypes: ?Array<FieldType>, schemas: Array<Schema>, context: Context) {
  const typeMap = { ...innerFieldTypes }
  const fieldTypeContext: FieldTypeContext = {
    fieldType: (typeName) => {
      if (!typeMap[typeName]) {
        if (typeName.startsWith('[') && typeName.endsWith(']')) {
          const fieldType = fieldTypeContext.fieldType(typeName.substr(1, typeName.length - 2))
          if (!fieldType) {
            return null
          }
          typeMap[typeName] = {
            name: typeName,
            description: `Array of type ${typeName.substr(1, typeName.length - 2)}`,
            inputType: fieldType.inputType ? new graphql.GraphQLList(fieldType.inputType) : null,
            outputType: fieldType.outputType ? new graphql.GraphQLList(fieldType.outputType) : null,
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
          typeMap[typeName] = buildModelTypeId(schema, fieldTypeContext, context)
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
              first: 'Integer',
              before: 'String',
              last: 'Integer'
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
  };
  (fieldTypes || []).forEach(f => {
    if (typeof f === 'function') {
      f = f(fieldTypeContext)
    }
    typeMap[f.name] = f
  })
  return fieldTypeContext
}
