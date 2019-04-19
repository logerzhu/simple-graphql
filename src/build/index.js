// @flow

import Sequelize from 'sequelize'
import _ from 'lodash'

import type { GraphQLFieldConfig } from 'graphql'
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema } from 'graphql'

import Schema from '../definition/Schema'
import Service from '../definition/Service'

import type {
  BuildOptions,
  FieldType,
  FieldTypeContext,
  Hook,
  InterfaceContext,
  Plugin,
  ResolverContext,
  SGContext
} from '../Definition'

import applyPlugins from './applyPlugins'
import buildResolverContext from './buildResolverContext'
import buildInterfaceContext from './buildInterfaceContext'
import buildFieldTypeContext from './buildFieldTypeContext'
import buildSequelizeModels from './buildSequelizeModels'
import buildServices from './buildServices'
import buildRootQueries from './buildRootQueries'
import buildRootMutations from './buildRootMutations'

export default function (sequelize: Sequelize, config: {
  fieldTypes?: Array<FieldType>,
  // TODO support Data Type
  schemas?: Array<Schema>,
  services?: Array<Service>,
  hooks?: Array<Hook>,
  plugins?: Array<Plugin>
}, buildOptions: BuildOptions): { graphQLSchema: GraphQLSchema, sgContext: any } {
  const sgContext: SGContext = {
    sequelize: sequelize,
    schemas: applyPlugins(config.schemas || [], config.plugins || [], buildOptions.plugin || {}),
    models: {},
    services: {},
    fieldType: (typeName) => null
  }

  const resolveContext = buildResolverContext(config.hooks || [], sgContext)
  const interfaceContext = buildInterfaceContext(sgContext)

  const context: ResolverContext & InterfaceContext & FieldTypeContext = {
    hookFieldResolve: (name, options) => resolveContext.hookFieldResolve(name, options),
    hookQueryResolve: (name, options) => resolveContext.hookQueryResolve(name, options),
    hookMutationResolve: (name, options) => resolveContext.hookMutationResolve(name, options),

    interface: (str) => {
      return interfaceContext.interface(str)
    },
    registerInterface: (name, gInterface) => {
      return interfaceContext.registerInterface(name, gInterface)
    },

    fieldType: (typeName) => null
  }

  const fieldTypeContext = buildFieldTypeContext(config.fieldTypes || [], config.schemas || [], context)
  context.fieldType = (typeName) => fieldTypeContext.fieldType(typeName)

  sgContext.fieldType = (typeName) => fieldTypeContext.fieldType(typeName)
  sgContext.models = buildSequelizeModels(sequelize, config.schemas || [], sgContext)
  sgContext.services = buildServices(config.services || [], sgContext)

  const rootQueries = buildRootQueries(config.schemas || [], config.services || [], context)
  const payloadFields: { [string]: GraphQLFieldConfig<any, any> } = {}
  const rootQueryObject = new GraphQLObjectType({
    name: 'RootQuery',
    fields: () => rootQueries
  })
  const schemaConfig = {}
  if (_.keys(rootQueries).length > 0) {
    payloadFields['relay'] = {
      description: 'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
      type: new GraphQLNonNull(rootQueryObject),
      resolve: () => {
        return {}
      }
    }
    schemaConfig.query = rootQueryObject
  }

  const rootMutations = buildRootMutations(config.schemas || [], config.services || [], payloadFields, context)
  if (_.keys(rootMutations).length > 0) {
    schemaConfig.mutation = new GraphQLObjectType({
      name: 'RootMutation',
      fields: () => rootMutations
    })
  }

  return {
    sgContext: sgContext,
    graphQLSchema: new GraphQLSchema(schemaConfig)
  }
}
