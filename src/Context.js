// @flow
import Sequelize from 'sequelize'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import _ from 'lodash'

import type {GraphQLObjectType} from 'graphql'

import Schema from './definition/Schema'
import StringHelper from './utils/StringHelper'
import Transformer from './transformer'

import SequelizeContext from './sequelize/SequelizeContext'

import type {LinkedFieldType, ArgsType, BuildOptionConfig} from './Definition'

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
  dbContext:SequelizeContext

  options:BuildOptionConfig

  dbModels:{[id:string]:Sequelize.Model}

  nodeInterface:graphql.GraphQLInterfaceType

  schemas:{[id:string]: Schema<any> }

  graphQLObjectTypes:{[id:string]: GraphQLObjectType}

  queries:{[id:string]:QueryConfig}

  mutations:{[id:string]:MutationConfig}

  connectionDefinitions:{[id:string]:{connectionType:graphql.GraphQLObjectType, edgeType:graphql.GraphQLObjectType}}

  constructor (sequelize:Sequelize, options:BuildOptionConfig) {
    this.dbContext = new SequelizeContext(sequelize)
    this.options = {...options}

    this.dbModels = {}
    this.schemas = {}
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

  addSchema (schema:Schema<any>) {
    if (this.schemas[schema.name]) {
      throw new Error('Schema ' + schema.name + ' already define.')
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
    this.dbModel(schema.name)
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
    if (!model) {
      throw new Error('Schema ' + name + ' not define.')
    }
    const typeName = model.name

    if (!this.dbModels[typeName]) {
      this.dbModels[typeName] = this.dbContext.define(model)
      Object.assign(this.dbModels[typeName], model.config.statics)
      Object.assign(this.dbModels[typeName].prototype, model.config.methods)
    }
    return this.dbModels[typeName]
  }

  wrapQueryResolve (config:QueryConfig):any {
    const self = this

    const dbModels = () => _.mapValues(this.schemas, (schema) => self.dbModel(schema.name))

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
      models: dbModels()
    },
      () => {
        return config.resolve(args, context, info, dbModels())
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

    const dbModels = () => _.mapValues(this.schemas, (model) => self.dbModel(model.name))

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
      models: dbModels()
    },
      () => config.resolve(source, args, context, info, dbModels())
    )
  }

  wrapMutateAndGetPayload (config:MutationConfig):any {
    const self = this

    const dbModels = () => _.mapValues(this.schemas, (schema) => self.dbModel(schema.name))

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
      models: dbModels()
    },
      () => config.mutateAndGetPayload(args, context, info, dbModels())
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
      _.forOwn(schema.config.associations.hasMany, (config, key) => {
        self.dbModel(schema.name).hasMany(self.dbModel(config.target), {
          ...config,
          as: key,
          foreignKey: config.foreignKey || config.foreignField + 'Id'
        })
      })
      _.forOwn(schema.config.associations.belongsToMany, (config, key) => {
        self.dbModel(schema.name).belongsToMany(self.dbModel(config.target), {
          ...config,
          as: key,
          foreignKey: config.foreignField + 'Id'
        })
      })
    })
  }
}
