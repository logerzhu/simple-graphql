// @flow
import Sequelize from 'sequelize'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import _ from 'lodash'

import type {GraphQLOutputType} from 'graphql'

import Query from './query'
import Mutation from './mutation'
import Model from './Model'
import ModelRef from './ModelRef'
import StringHelper from './utils/StringHelper'
import Transformer from './transformer'

import type {LinkedFieldType, ArgsType} from './Definition'

export type QueryConfig ={
  name:string,
  $type:LinkedFieldType,
  description?:string,
  args?:ArgsType,
  resolve: (args:{[argName: string]: any},
            context:any,
            info:graphql.GraphQLResolveInfo,
            models:{[id:string]:Sequelize.Model}) => any
}

export type MutationConfig ={
  name:string,
  description?:string,
  inputFields:ArgsType,
  outputFields:{[string]:LinkedFieldType},
  mutateAndGetPayload:(args:{[argName: string]: any},
                       context:any,
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

  connectionDefinitions:{[id:string]:{connectionType:graphql.GraphQLObjectType, edgeType:graphql.GraphQLObjectType}}

  constructor (sequelize:Sequelize) {
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

  addModel (model:Model) {
    if (this.models[model.name]) {
      throw new Error('Model ' + model.name + ' already define.')
    }
    this.models[model.name] = model

    _.forOwn(model.config.queries, (value, key) => {
      if (!value['name']) {
        value['name'] = key
      }
      this.addQuery(value)
    })
    if (model.config.options.singularQuery !== false) {
      this.addQuery(Query.singularQuery(model))
    }
    if (model.config.options.pluralQuery !== false) {
      this.addQuery(Query.pluralQuery(model))
    }

    _.forOwn(model.config.mutations, (value, key) => {
      if (!value['name']) {
        value['name'] = key
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

  addQuery (config:QueryConfig) {
    if (this.queries[config.name]) {
      throw new Error('Query ' + config.name + ' already define.')
    }
    this.queries[config.name] = config
  }

  addMutation (config:MutationConfig) {
    if (this.mutations[config.name]) {
      throw new Error('Mutation ' + config.name + ' already define.')
    }
    this.mutations[config.name] = config
  }

  graphQLObjectType (name:string):GraphQLOutputType {
    const model = this.models[name]
    if (!model) {
      throw new Error('Model ' + name + ' not define.')
    }
    const typeName = model.name

    if (!this.graphQLObjectTypes[typeName]) {
      const obj = Object.assign({}, model.config.fields, model.config.links)
      const interfaces = [this.nodeInterface]
      Object.assign(obj, {
        id: {
          $type: new graphql.GraphQLNonNull(graphql.GraphQLID),
          resolve: async function (root) {
            return relay.toGlobalId(StringHelper.toInitialUpperCase(model.name), root.id)
          }
        }
      })

      Object.assign(obj, Query.hasManyQueryFields(model))

      this.graphQLObjectTypes[typeName] = Transformer.toGraphQLFieldConfig(typeName, '', obj, this, interfaces).type
      if (this.graphQLObjectTypes[typeName] instanceof graphql.GraphQLObjectType) {
        this.graphQLObjectTypes[typeName].description = model.config.options.description
      }
    }
    return this.graphQLObjectTypes[typeName]
  }

  dbModel (name:string):Sequelize.Model {
    const model = this.models[name]
    if (!model) {
      throw new Error('Model ' + name + ' not define.')
    }
    const typeName = model.name

    if (!this.dbModels[typeName]) {
      this.dbModels[typeName] = Transformer.toSequelizeModel(this.sequelize, model)
      Object.assign(this.dbModels[typeName], model.config.statics)
      Object.assign(this.dbModels[typeName].Instance.prototype, model.config.methods)
    }
    return this.dbModels[typeName]
  }

  wrapQueryResolve (config:QueryConfig):any {
    const self = this

    const dbModels = () => _.mapValues(this.models, (model) => self.dbModel(model.name))

    const invoker = (schema, context, rootValue, requestString, variableValues) => {
      return graphql['graphql'](schema, requestString, rootValue, context, variableValues)
    }
    let hookFun = (action, invokeInfo, next) => next()
    this.options.hooks.reverse().forEach(hook => {
      if (!hook.filter || hook.filter({type: 'query', config})) {
        const preHook = hookFun
        hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
      }
    })

    return (source, args, context, info) => hookFun({
      type: 'query',
      config: config
    }, {
      source: source,
      args: args,
      context: context,
      info: info,
      models: dbModels()
    },
      () => {
        return config.resolve(args, context, info, dbModels(), invoker.bind(null, info.schema, context, info.rootValue))
      }
    )
  }

  wrapFieldResolve (config:{
    name:string,
    $type:LinkedFieldType,
    description?:string,
    args?:ArgsType,
    resolve: (source:any,
              args:{[argName: string]: any},
              context:any,
              info:graphql.GraphQLResolveInfo,
              models:{[id:string]:Sequelize.Model}) => any
  }):any {
    const self = this

    const dbModels = () => _.mapValues(this.models, (model) => self.dbModel(model.name))

    const invoker = (schema, context, rootValue, requestString, variableValues) => {
      return graphql['graphql'](schema, requestString, rootValue, context, variableValues)
    }
    let hookFun = (action, invokeInfo, next) => next()
    this.options.hooks.reverse().forEach(hook => {
      if (!hook.filter || hook.filter({type: 'field', config})) {
        const preHook = hookFun
        hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
      }
    })

    return (source, args, context, info) => hookFun({
      type: 'field',
      config: config
    }, {
      source: source,
      args: args,
      context: context,
      info: info,
      models: dbModels()
    },
      () => config.resolve(source, args, context, info, dbModels(), invoker.bind(null, info.schema, context, info.rootValue))
    )
  }

  wrapMutateAndGetPayload (config:MutationConfig):any {
    const self = this

    const dbModels = () => _.mapValues(this.models, (model) => self.dbModel(model.name))

    const invoker = (schema, context, rootValue, requestString, variableValues) => {
      return graphql['graphql'](schema, requestString, rootValue, context, variableValues)
    }
    let hookFun = (action, invokeInfo, next) => next()
    this.options.hooks.reverse().forEach(hook => {
      if (!hook.filter || hook.filter({type: 'mutation', config})) {
        const preHook = hookFun
        hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
      }
    })

    return (args, context, info) => hookFun({
      type: 'mutation',
      config: config
    }, {
      args: args,
      context: context,
      info: info,
      models: dbModels()
    },
      () => config.mutateAndGetPayload(args, context, info, dbModels(), invoker.bind(null, info.schema, context, info.rootValue))
    )
  }

  connectionDefinition (ref:ModelRef):{connectionType:graphql.GraphQLObjectType, edgeType:graphql.GraphQLObjectType} {
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

  connectionType (ref:ModelRef):graphql.GraphQLObjectType {
    return this.connectionDefinition(ref).connectionType
  }

  edgeType (ref:ModelRef):graphql.GraphQLObjectType {
    return this.connectionDefinition(ref).edgeType
  }

  buildModelAssociations ():void {
    const self = this
    _.forOwn(self.models, (model, key) => {
      model.config.associations.hasOne.forEach(config => {
        self.dbModel(model.name).hasOne(self.dbModel(config.target), config.options)
      })
      model.config.associations.belongsTo.forEach(config => {
        self.dbModel(model.name).belongsTo(self.dbModel(config.target), config.options)
      })
      model.config.associations.hasMany.forEach(config => {
        self.dbModel(model.name).hasMany(self.dbModel(config.target), config.options)
      })
      model.config.associations.belongsToMany.forEach(config => {
        self.dbModel(model.name).belongsToMany(self.dbModel(config.target), config.options)
      })
    })
  }
}
