//@flow
import Sequelize from 'sequelize'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import _ from 'lodash'

import type {GraphQLOutputType} from 'graphql'

import Query from  './query'
import Mutation from './mutation'
import Model from  './Model'
import GS from './index'
import StringHelper from "./utils/StringHelper"

export type QueryConfig ={
  name:string,
  $type: any,
  args?: any,
  resolve: any
}

export type MutationConfig ={
  name:string,
  description?:string,
  inputFields:any,
  outputFields:any,
  mutateAndGetPayload:(args:{[argName: string]: any},
                       info:graphql.GraphQLResolveInfo,
                       models:{[id:string]:Sequelize.Model}) => any
}

export default class Context {
  sequelize:Sequelize

  options:any

  dbModels:{[id:string]:Sequelize.Model}

  nodeInterface:graphql.GraphQLInterfaceType

  models:{[id:string]: Model}

  graphQLObjectTypes:{[id:string]: GraphQLOutputType}

  queries:{[id:string]:QueryConfig}

  mutations:{[id:string]:MutationConfig}

  connectionDefinitions:{[id:string]:{connectionType:graphql.GraphQLObjectType,edgeType:graphql.GraphQLObjectType}}

  constructor(sequelize:Sequelize) {
    this.sequelize = sequelize
    this.options = {
      hooks: []
    }
    this.dbModels = {}
    this.models = {}
    this.graphQLObjectTypes = {}
    this.queries = {}
    this.mutations = {}

    this.connectionDefinitions = {}

    const self = this
    this.nodeInterface = relay.nodeDefinitions(null, (obj) => {
      const type = obj._type
      return self.graphQLObjectTypes[type]
    }).nodeInterface
  }

  addModel(model:Model) {
    if (this.models[model.name]) {
      throw new Error("Model " + model.name + " already define.")
    }
    this.models[model.name] = model

    _.forOwn(model.config.queries, (value, key)=> {
      if (!value["name"]) {
        value["name"] = key
      }
      this.addQuery(value)
    })
    if (model.config.options.singularQuery !== false) {
      this.addQuery(Query.singularQuery(model))
    }
    if (model.config.options.pluralQuery !== false) {
      this.addQuery(Query.pluralQuery(model))
    }

    _.forOwn(model.config.mutations, (value, key)=> {
      if (!value["name"]) {
        value["name"] = key
      }
      this.addMutation(value)
    })
    if (model.config.options.addMutation !== false) {
      this.addMutation(Mutation.addMutation(model))
    }
    if (model.config.options.updateMutation !== false) {
      this.addMutation(Mutation.updateMutation(model))
    }
    if (model.config.options.deleteMutation !== false) {
      this.addMutation(Mutation.deleteMutation(model))
    }
    this.dbModel(model.name)
  }

  addQuery(config:QueryConfig) {
    if (this.queries[config.name]) {
      throw new Error("Query " + config.name + " already define.")
    }
    this.queries[config.name] = config
  }

  addMutation(config:MutationConfig) {
    if (this.mutations[config.name]) {
      throw new Error("Mutation " + config.name + " already define.")
    }
    this.mutations[config.name] = config
  }

  graphQLObjectType(name:string):GraphQLOutputType {
    const model = this.models[name]
    if (!model) {
      throw new Error("Model " + name + " not define.")
    }
    const typeName = model.name

    if (!this.graphQLObjectTypes[typeName]) {
      const obj = Object.assign({}, model.config.fields)
      const interfaces = [this.nodeInterface]
      Object.assign(obj, {
        id: {
          $type: new graphql.GraphQLNonNull(graphql.GraphQLID),
          resolve: async function (root) {
            return relay.toGlobalId(StringHelper.toInitialUpperCase(model.name), root.id)
          }
        }
      })
      this.graphQLObjectTypes[typeName] = GS.graphQLFieldConfig(typeName, "", obj, this, interfaces).type
      if (this.graphQLObjectTypes[typeName] instanceof graphql.GraphQLObjectType) {
        this.graphQLObjectTypes[typeName].description = model.config.options.description
      }
    }
    return this.graphQLObjectTypes[typeName]
  }

  dbModel(name:string):Sequelize.Model {
    const model = this.models[name]
    if (!model) {
      throw new Error("Model " + name + " not define.")
    }
    const typeName = model.name

    if (!this.dbModels[typeName]) {

      const dbDefinition = {}

      const dbType = (fieldType:any) => {
        switch (fieldType) {
          case String:
            return Sequelize.STRING
          case Number:
            return Sequelize.DOUBLE
          case Boolean:
            return Sequelize.BOOLEAN
          case Date:
            return Sequelize.DATE
          case JSON:
            return Sequelize.JSONB
        }
        return null
      }
      _.forOwn(model.config.fields, (value, key)=> {
        let fType = value
        if (value && value["$type"]) {
          fType = value["$type"]
        }
        if (fType instanceof GS.ModelRef) {
          if (value && value["$type"] && value.required) {
            model.belongsTo({target: fType.name, options: {as: key, foreignKey: key + "Id", constraints: true}})
          } else {
            model.belongsTo({target: fType.name, options: {as: key, foreignKey: key + "Id", constraints: false}})
          }

        } else {
          const type = dbType(fType)
          if (type) {
            if (value && value["$type"]) {
              dbDefinition[key] = {type: type}
              if (value.required != null) {
                dbDefinition[key].allowNull = !value.required
              }
              if (value.defaultValue != null) {
                dbDefinition[key].defaultValue = value.defaultValue
              }
              if (value.validate != null) {
                dbDefinition[key].validate = value.validate
              }
              if (value.enumValues != null) {
                dbDefinition[key].type = Sequelize.ENUM(...value.enumValues)
              }
              dbDefinition[key] = {...dbDefinition[key], ...value.column}
            } else {
              dbDefinition[key] = {type: type}
            }
          }
        }
      })
      console.log("Create Sequlize Model with config", typeName, dbDefinition, model.config.options["table"])
      this.dbModels[typeName] = this.sequelize.define(typeName, dbDefinition, model.config.options["table"])
    }
    return this.dbModels[typeName]
  }

  wrapResolve(type:'field'|'query', config:QueryConfig):any {
    const self = this

    const dbModels = () => _.mapValues(this.models, (model) => self.dbModel(model.name))

    const invoker = (schema, rootValue, requestString, variableValues) => {
      return graphql['graphql'](schema, requestString, rootValue, null, variableValues)
    }
    let hookFun = ((action, invokeInfo, next) => next())
    this.options.hooks.reverse().forEach(hook => {
      if (!hook.filter || hook.filter({type, config})) {
        const preHook = hookFun
        hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
      }
    })

    switch (type) {
      case 'field':
        return (source, args, context, info) => hookFun({
            type: type,
            config: config
          }, {
            source: source,
            args: args,
            info: info,
            models: dbModels()
          },
          () => config.resolve(source, args, info, dbModels(), invoker.bind(null, info.schema, info.rootValue))
        )
      case 'query':
        return (source, args, context, info) => hookFun({
            type: type,
            config: config
          }, {
            source: source,
            args: args,
            info: info,
            models: dbModels()
          },
          () => {
            return config.resolve(args, info, dbModels(), invoker.bind(null, info.schema, info.rootValue))
          }
        )
    }
  }

  wrapMutateAndGetPayload(type:'mutation', config:MutationConfig):any {
    const self = this

    const dbModels = () => _.mapValues(this.models, (model) => self.dbModel(model.name))

    const invoker = (schema, rootValue, requestString, variableValues) => {
      return graphql['graphql'](schema, requestString, rootValue, null, variableValues)
    }
    let hookFun = ((action, invokeInfo, next) => next())
    this.options.hooks.reverse().forEach(hook => {
      if (!hook.filter || hook.filter({type, config})) {
        const preHook = hookFun
        hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
      }
    })

    switch (type) {
      case 'mutation':
        return async function (args, context, info) {
          return await hookFun({
              type: type,
              config: config
            }, {
              args: args,
              info: info,
              models: dbModels()
            },
            () => config.mutateAndGetPayload(args, info, dbModels(), invoker.bind(null, info.schema, info.rootValue))
          )
        }
    }
  }

  connectionDefinition(ref:GS.ModelRef):{connectionType:graphql.GraphQLObjectType,edgeType:graphql.GraphQLObjectType} {
    if (!this.connectionDefinitions[ref.name]) {
      this.connectionDefinitions[ref.name] = relay.connectionDefinitions({
        name: StringHelper.toInitialUpperCase(ref.name),
        nodeType: this.graphQLObjectType(ref.name),
        connectionFields: {
          count: {
            type: graphql.GraphQLFloat
          }
        }
      })
    }
    return this.connectionDefinitions[ref.name]
  }

  connectionType(ref:GS.ModelRef):graphql.GraphQLObjectType {
    return this.connectionDefinition(ref).connectionType
  }

  edgeType(ref:GS.ModelRef):graphql.GraphQLObjectType {
    return this.connectionDefinition(ref).edgeType
  }

  buildModelAssociations():void {
    const self = this
    _.forOwn(self.models, (model, key)=> {
      model.config.associations.hasOne.forEach((config => {
        self.dbModel(model.name).hasOne(self.dbModel(config.target), config.options)
      }))
      model.config.associations.belongsTo.forEach((config => {
        self.dbModel(model.name).belongsTo(self.dbModel(config.target), config.options)
      }))
    })
  }

}