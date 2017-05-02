//@flow

import Sequelize from 'sequelize'
import _ from 'lodash'

import * as graphql from 'graphql'
import * as relay from 'graphql-relay'

import type {GraphQLInputField, GraphQLOutputType, GraphQLFieldConfig,GraphQLInputFieldMap,GraphQLInputFieldConfig, GraphQLInputFieldConfigMap, GraphQLFieldResolver} from 'graphql'

import Model from './Model'
import Type from './type'
import Context from './Context'
import StringHelper from "./utils/StringHelper"
import Connection from "./Connection"

const GS = {}

GS.Connection = Connection

GS.Model = Model

GS.ModelRef = class {
  name:string

  constructor(name:string) {
    this.name = name
  }
}

GS.model = (name:string, options:{[id:string]: any} = {}):GS.Model => new Model(name, options)

GS.modelRef = (name:string):GS.ModelRef => new GS.ModelRef(name)

GS.FilterConfig = class {
  fields:any

  includeFieldFilter:(key:string, value:any) =>boolean

  constructor(fields:any,
              includeFieldFilter:(key:string, value:any) =>boolean) {
    this.fields = fields
    this.includeFieldFilter = includeFieldFilter
  }
}

GS.graphQLInputFieldMap = (name:string,
                           fields:{[id:string]:any},
                           includeFieldFilter:?(key:string, value:any)=>boolean):GraphQLInputFieldConfigMap => {
  const typeName = (name:string, path:string) => name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join("")

  const convert = (name:string,
                   path:string,
                   field:any):?GraphQLInputFieldConfig => {
    if (graphql.isInputType(field)) {
      return {type: field}
    }
    if (graphql.isCompositeType(field)) {
      return
    }

    switch (field) {
      case String:
        return {type: graphql.GraphQLString}
      case Number:
        return {type: graphql.GraphQLFloat}
      case Boolean:
        return {type: graphql.GraphQLBoolean}
      case Date:
        return {type: Type.Date}
      case JSON:
        return {type: Type.Json}
    }

    if (_.isArray(field)) {
      const subField = convert(name, path, field[0])
      if (!subField) return

      return {
        type: new graphql.GraphQLList(subField.type)
      }
    }

    if (field instanceof GS.ModelRef) {
      return {
        type: Type.globalIdInputType(field.name)
      }
    }
    if (field instanceof Object) {
      if (field['$type']) {
        let result:?GraphQLInputFieldConfig
        if (field['enumValues']) {
          const values:{[index:string]:any} = {}
          field['enumValues'].forEach(
            t => values[t] = {value: t}
          )
          result = ({
            type: new graphql.GraphQLEnumType({
              name: typeName(name, path),
              values: values
            })
          }:GraphQLInputFieldConfig)
        } else {
          result = convert(name, path, field['$type'])
        }
        if (result) {
          result.description = field['description']
          if (field['default'] != null && !_.isFunction(field['default'])) {
            result.defaultValue = field['default']
            result.description = (result.description ? result.description : "") + " 默认值:" + result.defaultValue
          }
        }
        return result
      } else {
        const inputType = graphQLInputType(typeName(name, path), field)
        if (inputType) {
          return {type: inputType}
        } else {
          return
        }
      }
    }
  }

  const graphQLInputType = (name:string,
                            config:any):?graphql.GraphQLInputType => {
    name = StringHelper.toInitialUpperCase(name)

    if (config["$type"]) {
      const result = convert(name, "", config)
      if (result && result.type) {
        return result.type
      } else {
        //return null
      }
    } else {
      const fields = GS.graphQLInputFieldMap(name, config, includeFieldFilter)
      if (_.keys(fields).length === 0) {
        //return null
      }
      return new graphql.GraphQLInputObjectType({
        name: name + "Input",
        fields: fields
      })
    }
  }

  const fieldMap:GraphQLInputFieldConfigMap = {}

  _.forOwn(fields, (value, key) => {
    if (value['$type'] && (value['hidden'] || value['resolve'])) {
      //Hidden field, ignore
      //Have resolve method, ignore
    } else if (!includeFieldFilter || includeFieldFilter(key, value)) {
      const inputField = convert(name, key, value)
      if (inputField) {
        if (value['$type'] && value['required']) {
          fieldMap[key] = inputField
          if (fieldMap[key] && !(inputField.type instanceof graphql.GraphQLNonNull)) {
            fieldMap[key].type = new graphql.GraphQLNonNull(inputField.type)
          }
        } else {
          fieldMap[key] = inputField
        }
      }
    }
  })
  return fieldMap
}

GS.graphQLFieldConfig = (name:string,
                         postfix:string,
                         fieldType:any,
                         context:Context,
                         interfaces:any = []):GraphQLFieldConfig<any,any> => {

  const typeName = (path:string) => path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join("")

  if (graphql.isOutputType(fieldType)) {
    return {type: fieldType}
  }
  switch (fieldType) {
    case String:
      return {type: graphql.GraphQLString}
    case Number:
      return {type: graphql.GraphQLFloat}
    case Boolean:
      return {type: graphql.GraphQLBoolean}
    case Date:
      return {type: Type.Date}
    case JSON:
      return {type: Type.Json}
  }

  if (_.isArray(fieldType)) {
    const elementType = GS.graphQLFieldConfig(name, postfix, fieldType[0], context).type
    return {
      type: new graphql.GraphQLList(elementType),
      resolve: async function () {
        return null
      }
    }
  }

  if (fieldType instanceof GS.ModelRef) {
    return {
      type: context.graphQLObjectType(fieldType.name),
      resolve: context.wrapResolve('field', {
        name: name.split("\.").slice(-1)[0],
        path: name,
        $type: context.graphQLObjectType(fieldType.name),
        resolve: async function (root, args, info, models) {
          const fieldName = name.split("\.").slice(-1)[0]
          //判断是否只有model Id, 如果只有model Id, 通过ID 查找相关的model
          if (root && _.isFunction(root["get" + StringHelper.toInitialUpperCase(fieldName)])) {
            return await root["get" + StringHelper.toInitialUpperCase(fieldName)]()
          }
          if (root && root[fieldName] && (
              typeof root[fieldName] === 'number'
              || typeof root[fieldName] === 'string'
            )) {
            return await models[fieldType.name].findOne({where: {id: root[fieldName]}})
          }
          return root[fieldName]
        }
      })
    }
  }

  if (fieldType instanceof GS.Connection.ConnectionType) {
    return {
      type: context.connectionType(fieldType.nodeType)
    }
  }

  if (fieldType instanceof GS.Connection.EdgeType) {
    return {
      type: context.edgeType(fieldType.nodeType)
    }
  }

  if (fieldType instanceof Object) {
    if (fieldType['$type']) {
      const result = GS.graphQLFieldConfig(name, postfix, fieldType["$type"], context)
      if (fieldType['enumValues']) {
        const values = {}
        fieldType['enumValues'].forEach(
          t => values[t] = {value: t}
        )
        result.type = new graphql.GraphQLEnumType({
          name: typeName(name) + postfix,
          values: values
        })
      }
      if (fieldType['required'] && !(result.type instanceof graphql.GraphQLNonNull)) {
        result.type = new graphql.GraphQLNonNull(result.type)
      }
      if (fieldType['resolve']) {
        result['resolve'] = fieldType['resolve']
      }
      if (fieldType['args']) {
        result['args'] = GS.graphQLInputFieldMap(typeName(name), fieldType['args'], (k, v) => true)
      }
      result.description = fieldType['description']
      return result
    } else {
      return {
        type: new graphql.GraphQLObjectType({
          name: typeName(name) + postfix,
          interfaces: interfaces,
          fields: () => {
            const fields = {}
            _.forOwn(fieldType, (value, key) => {
              if (value['$type'] && value['hidden']) {
              } else {
                fields[key] = GS.graphQLFieldConfig(name + postfix + "." + key, "", value, context)
              }
            })
            return fields
          }
        }),
        resolve: async function (root) {
          return root[name.split("\.").slice(-1)[0]]
        }
      }
    }
  }
  throw new Error("Unsupported type: " + fieldType)
}


GS.build = (sequelize:Sequelize, models:Array<Model>, options:any):any => {
  const context = new Context(sequelize)

  //添加Model
  models.forEach(model => {
    context.addModel(model)
  })

  context.buildModelAssociations()


  const finalQueries:{[fieldName: string]: graphql.GraphQLFieldConfig<any,any>} = {}

  _.forOwn(context.queries, (value, key)=> {
    finalQueries[key] = {
      type: GS.graphQLFieldConfig(
        key,
        "Payload",
        value.$type,
        context).type,
      resolve: context.wrapResolve("query", value),
      description: value.description
    }
    if (value.args) {
      if (value.args instanceof GS.FilterConfig) {
        finalQueries[key].args = GS.graphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.args.fields, value.args.includeFieldFilter)
      } else {
        finalQueries[key].args = GS.graphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.args, (k, v)=>true)
      }
    }
  })

  const nodeConfig = {
    name: 'node',
    description: 'Fetches an object given its ID',
    type: context.nodeInterface,
    args: {
      id: {
        type: new graphql.GraphQLNonNull(graphql.GraphQLID),
        description: 'The ID of an object'
      }
    },
    resolve: context.wrapResolve("query", {
      name: "node",
      $type: context.nodeInterface,
      resolve: async function (args, info, models, invoker) {
        const id = relay.fromGlobalId(args.id)
        if (!context.models[id.type]) return null
        const record = await models[id.type].findOne({where: {id: id.id}})
        if (record) {
          record._type = id.type
        }
        return record
      }
    })
  }

  const viewerInstance = {
    _type: 'Viewer',
    id: relay.toGlobalId("Viewer", "viewer")
  }

  const viewerType = new graphql.GraphQLObjectType({
    name: 'Viewer',
    interfaces: [context.nodeInterface],
    fields: () => {
      return Object.assign({id: {type: new graphql.GraphQLNonNull(graphql.GraphQLID)}, node: nodeConfig}, finalQueries)
    }
  })

  return new graphql.GraphQLSchema({
    query: new graphql.GraphQLObjectType({
      name: 'RootQuery',
      fields: () => {
        return Object.assign({
          viewer: {
            type: viewerType,
            resolve: ()=>viewerInstance
          },
          node: nodeConfig
        }, finalQueries)
      }
    }),
    mutation: new graphql.GraphQLObjectType({
      name: 'RootMutation',
      fields: () => {
        const fields:{[fieldName: string]: graphql.GraphQLFieldConfig<any,any>} = {}
        _.forOwn(context.mutations, (value, key)=> {
          let inputFields
          if (value.inputFields instanceof GS.FilterConfig) {
            inputFields = GS.graphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.inputFields.fields, value.inputFields.includeFieldFilter)
          } else {
            inputFields = GS.graphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.inputFields, (k, v)=>true)
          }
          const outputFields = {viewer: {type: viewerType, resolve: ()=>viewerInstance}}
          _.forOwn(value.outputFields, (fValue, fKey) => {
            outputFields[fKey] = GS.graphQLFieldConfig(
              key + "." + fKey,
              "Payload",
              fValue,
              context
            )
          })
          if (!value["name"]) {
            value["name"] = key
          }
          fields[key] = Type.mutationWithClientMutationId({
            name: StringHelper.toInitialUpperCase(key),
            inputFields: inputFields,
            outputFields: outputFields,
            mutateAndGetPayload: context.wrapMutateAndGetPayload('mutation', value),
            description: value.doc
          })
        })
        return fields
      }
    })
  })
}

export default GS