// @flow
import Sequelize from 'sequelize'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import _ from 'lodash'

import type {GraphQLObjectType} from 'graphql'

import Schema from './definition/Schema'
import Service from './definition/Service'
import StringHelper from './utils/StringHelper'
import Transformer from './transformer'

import SequelizeContext from './sequelize/SequelizeContext'

import type {SGContext, LinkedFieldType, ArgsType, BuildOptionConfig} from './Definition'

export type QueryConfig ={
  name:string,
  $type:LinkedFieldType,
  description?:string,
  args?:ArgsType,
  resolve: (args:{[argName: string]: any},
            context:any,
            info:graphql.GraphQLResolveInfo,
            sgContext:SGContext) => any
}

export type MutationConfig ={
  name:string,
  description?:string,
  inputFields:ArgsType,
  outputFields:{[string]:LinkedFieldType},
  mutateAndGetPayload:(args:{[argName: string]: any},
                       context:any,
                       info:graphql.GraphQLResolveInfo,
                       sgContext:SGContext) => any
}

export default class Context {
  dbContext:SequelizeContext

  options:BuildOptionConfig

  dbModels:{[id:string]:Sequelize.Model}

  nodeInterface:graphql.GraphQLInterfaceType

  schemas:{[id:string]: Schema<any> }

  services:{[id:string]: Service<any> }

  graphQLObjectTypes:{[id:string]: GraphQLObjectType}

  queries:{[id:string]:QueryConfig}

  mutations:{[id:string]:MutationConfig}

  connectionDefinitions:{[id:string]:{connectionType:graphql.GraphQLObjectType, edgeType:graphql.GraphQLObjectType}}

  constructor (sequelize:Sequelize, options:BuildOptionConfig) {
    this.dbContext = new SequelizeContext(sequelize)
    this.options = {...options}

    this.dbModels = {}
    this.schemas = {}
    this.services = {}
    this.graphQLObjectTypes = {}
    this.queries = {}
    this.mutations = {}

    this.connectionDefinitions = {}

    const self = this
    this.nodeInterface = relay.nodeDefinitions((globalId) => {
      var {type, id} = relay.fromGlobalId(globalId)
      console.log('Warning-------------------- node id Fetcher not implement' + type + ' ' + id)
    }, (obj) => {
      const type = obj._type
      return self.graphQLObjectTypes[type]
    }).nodeInterface
  }

  getSGContext () {
    return {
      sequelize: this.dbContext.sequelize,
      models: _.mapValues(this.schemas, (schema) => this.dbModel(schema.name)),
      services: _.mapValues(this.services, (service) => service.config.statics)
    }
  }

  addSchema (schema:Schema<any>) {

    if (this.schemas[schema.name]) {
      throw new Error('Schema ' + schema.name + ' already define.')
    }
    if (this.services[schema.name]) {
      throw new Error('Schema ' + schema.name + ' conflict with Service ' + schema.name)
    }
    this.schemas[schema.name] = schema

    this.dbContext.applyPlugin(schema)

    schema.fields({
      createdAt: {
        $type: Date,
        initializable: false,
        mutable: false
      },
      updatedAt: {
        $type: Date,
        initializable: false,
        mutable: false
      }
    })

    _.forOwn(schema.config.queries, (value, key) => {
      if (!value['name']) {
        value['name'] = key
      }
      this.addQuery(value)
    })

    _.forOwn(schema.config.mutations, (value, key) => {
      if (!value['name']) {
        value['name'] = key
      }
      this.addMutation(value)
    })
    //console.log('addSchema',schema.name)

    this.dbModel(schema.name)
  }

  addService (service:Service<any>) {
    const self = this
    if (self.services[service.name]) {
      throw new Error('Service ' + service.name + ' already define.')
    }
    if (self.schemas[service.name]) {
      throw new Error('Service ' + service.name + ' conflict with Schema ' + service.name)
    }
    service.statics({
      getSGContext: () => self.getSGContext()
    })
    self.services[service.name] = service

    _.forOwn(service.config.queries, (value, key) => {
      if (!value['name']) {
        value['name'] = key
      }
      self.addQuery(value)
    })

    _.forOwn(service.config.mutations, (value, key) => {
      if (!value['name']) {
        value['name'] = key
      }
      self.addMutation(value)
    })
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

  graphQLObjectType (name:string):GraphQLObjectType {
    const model = this.schemas[name]
    if (!model) {
      throw new Error('Schema ' + name + ' not define.')
    }
    const typeName = model.name

    if (!this.graphQLObjectTypes[typeName]) {
      const obj = Object.assign({
        id: {}
      }, model.config.fields, model.config.links)
      obj.id = {
        $type: new graphql.GraphQLNonNull(graphql.GraphQLID),
        resolve: async function (root) {
          return relay.toGlobalId(StringHelper.toInitialUpperCase(model.name), root.id)
        }
      }
      const interfaces = [this.nodeInterface]

      const objectType = Transformer.toGraphQLFieldConfig(typeName, '', obj, this, interfaces).type
      if (objectType instanceof graphql.GraphQLObjectType) {
        objectType.description = model.config.options.description
        this.graphQLObjectTypes[typeName] = objectType
      }
    }
    return this.graphQLObjectTypes[typeName]
  }

  dbModel (name:string):Sequelize.Model {

    const model = this.schemas[name]
    // console.log('dbModel',name,model)
    if (!model) {
      // console.log(this.schemas)
      throw new Error('Schema ' + name + ' not define.')
    }
    const typeName = model.name
    const self = this
    if (!self.dbModels[typeName]) {
      self.dbModels[typeName] = self.dbContext.define(model)
      Object.assign(self.dbModels[typeName], {
        ...model.config.statics,
        getSGContext: () => self.getSGContext()
      })
      Object.assign(self.dbModels[typeName].prototype, {
        ...model.config.methods,
        getSGContext: () => self.getSGContext()
      })
    }
    return self.dbModels[typeName]
  }

  wrapQueryResolve (config:QueryConfig):any {
    const self = this
    console.log(this.options)

    let hookFun = (action, invokeInfo, next) => next()

    if (this.options.hooks != null) {
      this.options.hooks.reverse().forEach(hook => {
        if (!hook.filter || hook.filter({type: 'query', config})) {
          const preHook = hookFun
          hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
        }
      })
    }

    return (source, args, context, info) => hookFun({
      type: 'query',
      config: config
    }, {
      source: source,
      args: args,
      context: context,
      info: info,
      sgContext: self.getSGContext()
    },
      () => {
        return config.resolve(args, context, info, self.getSGContext())
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
              sgContext:SGContext) => any
  }):any {
    const self = this

    let hookFun = (action, invokeInfo, next) => next()
    if (this.options.hooks != null) {
      this.options.hooks.reverse().forEach(hook => {
        if (!hook.filter || hook.filter({type: 'field', config})) {
          const preHook = hookFun
          hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
        }
      })
    }

    return (source, args, context, info) => hookFun({
      type: 'field',
      config: config
    }, {
      source: source,
      args: args,
      context: context,
      info: info,
      sgContext: self.getSGContext()
    },
      () => config.resolve(source, args, context, info, self.getSGContext())
    )
  }

  wrapMutateAndGetPayload (config:MutationConfig):any {
    const self = this

    let hookFun = (action, invokeInfo, next) => next()
    if (this.options.hooks != null) {
      this.options.hooks.reverse().forEach(hook => {
        if (!hook.filter || hook.filter({type: 'mutation', config})) {
          const preHook = hookFun
          hookFun = (action, invokeInfo, next) => hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next))
        }
      })
    }

    return (args, context, info) => hookFun({
      type: 'mutation',
      config: config
    }, {
      args: args,
      context: context,
      info: info,
      sgContext: self.getSGContext()
    },
      () => config.mutateAndGetPayload(args, context, info, self.getSGContext())
    )
  }

  connectionDefinition (schemaName:string):{connectionType:graphql.GraphQLObjectType, edgeType:graphql.GraphQLObjectType} {
    if (!this.connectionDefinitions[schemaName]) {
      this.connectionDefinitions[schemaName] = relay.connectionDefinitions({
        name: StringHelper.toInitialUpperCase(schemaName),
        nodeType: this.graphQLObjectType(schemaName),
        connectionFields: {
          count: {
            type: graphql.GraphQLFloat
          }
        }
      })
    }
    return this.connectionDefinitions[schemaName]
  }

  connectionType (schemaName:string):graphql.GraphQLObjectType {
    return this.connectionDefinition(schemaName).connectionType
  }

  edgeType (schemaName:string):graphql.GraphQLObjectType {
    return this.connectionDefinition(schemaName).edgeType
  }

  buildModelAssociations ():void {
    const self = this
    _.forOwn(self.schemas, (schema, schemaName) => {
      console.log('buildModelAssociations',schema.config.associations.hasMany)
      _.forOwn(schema.config.associations.hasMany, (config, key) => {
        console.log('dd',key,config)
        let d = {
          ...config,
          as: key,
          foreignKey: config.foreignKey || config.foreignField + 'Id',
          through: undefined
        }
        console.log(d)
        self.dbModel(schema.name).hasMany(self.dbModel(config.target), d)
      })

      _.forOwn(schema.config.associations.belongsToMany, (config, key) => {
        self.dbModel(schema.name).belongsToMany(self.dbModel(config.target), {
          ...config,
          as: key,
          foreignKey: config.foreignField + 'Id',
          through: config.through && {...config.through, model: self.dbModel(config.through.model)}
        })
      })

      _.forOwn(schema.config.associations.hasOne, (config, key) => {
        self.dbModel(schema.name).hasOne(self.dbModel(config.target), {
          ...config,
          as: key,
          foreignKey: config.foreignKey || config.foreignField + 'Id'
        })
      })

      _.forOwn(schema.config.associations.belongsTo, (config, key) => {
        self.dbModel(schema.name).belongsTo(self.dbModel(config.target), {
          ...config,
          as: key,
          foreignKey: config.foreignKey || config.foreignField + 'Id'
        })
      })
    })
  }
}
