// @flow
import type { FieldOptions, FieldType, FieldTypeContext, InterfaceContext, ResolverContext } from '../Definition'
import Schema from '../definition/Schema'
import innerFieldTypes from './fieldType'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import toGraphQLFieldConfigMap from '../transformer/toGraphQLFieldConfigMap'
import globalIdType from './fieldType/globalIdType'
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
    outputResolve: async function (root, args, context, info, sgContext) {
      const fieldName = info.fieldName
      if (root[fieldName]) {
        if (typeof root[fieldName] === 'string' || typeof root[fieldName] === 'number') {
          return sgContext.models[typeName].findOne({ where: { id: root[fieldName] } })
        } else {
          return root[fieldName]
        }
      } else {
        return sgContext.models[typeName].findOne({ where: { id: root[fieldName + 'Id'] } })
      }
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

function buildDataType (name: string, options: FieldOptions, fieldTypeContext: FieldTypeContext, context: Context): FieldType {
  let outputType = toGraphQLFieldConfigMap(name, '', { '': options }, {
    hookFieldResolve: (name, options) => context.hookFieldResolve(name, options),
    hookQueryResolve: (name, options) => context.hookQueryResolve(name, options),
    hookMutationResolve: (name, options) => context.hookMutationResolve(name, options),
    fieldType: (typeName) => fieldTypeContext.fieldType(typeName)
  })[''].type

  let inputType = toGraphQLInputFieldConfigMap(name, ({ '': options }: any), fieldTypeContext)[''].type
  return {
    name: name,
    description: name,
    inputType: inputType,
    outputType: outputType
  }
}

export default function (fieldTypes: Array<FieldType>, schemas: Array<Schema>, context: Context) {
  const typeMap = { ...innerFieldTypes }

  const fieldTypeContext: FieldTypeContext = {
    fieldType: (typeName) => {
      if (typeof typeName !== 'string') {
        console.log(typeName, typeof typeName)
      }
      if (!typeMap[typeName]) {
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
                  const list = await sgContext.models[subTypeName].findAll({ where: { id: { $in: root[fieldName] } } })
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
  }
  schemas.forEach(schema => {
    _.forOwn(schema.config.dataTypes, (value, key) => {
      typeMap[key] = buildDataType(key, value, fieldTypeContext, context)
    })
  })
  fieldTypes.forEach(f => {
    typeMap[f.name] = f
  })
  return fieldTypeContext
}
