import { Sequelize } from 'sequelize'
import _ from 'lodash'

import {
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLSchemaConfig
} from 'graphql'

import Schema from '../definition/Schema'
import Service from '../definition/Service'

import {
  BuildOptions,
  DataTypeConfig,
  TypeConfig,
  TypeContext,
  HookConfig,
  InterfaceContext,
  MutationConfigMap,
  PluginConfig,
  QueryConfigMap,
  ResolverContext,
  SGContext
} from '../Definition'

import applyPluginsToSchemas from './applyPluginsToSchemas'
import applyPluginsToModels from './applyPluginsToModels'
import buildResolverContext from './buildResolverContext'
import buildPlugins from './buildPlugins'
import buildInterfaceContext from './buildInterfaceContext'
import buildFieldTypeContext from './buildFieldTypeContext'
import buildSequelizeModels from './buildSequelizeModels'
import buildServices from './buildServices'
import buildRootQueries from './buildRootQueries'
import buildRootMutations from './buildRootMutations'

export default function (
  sequelize: Sequelize,
  config: {
    dataTypes?: Array<DataTypeConfig>
    fieldTypes?: Array<TypeConfig>
    schemas?: Array<Schema>
    services?: Array<typeof Service & { new (): Service }>
    hooks?: Array<HookConfig>
    plugins?: Array<PluginConfig>
    queries?: QueryConfigMap
    mutations?: MutationConfigMap
  },
  buildOptions: BuildOptions
): { graphQLSchema: GraphQLSchema; sgContext: SGContext } {
  const plugins = buildPlugins(config.plugins || [])
  const sgContext: SGContext = {
    sequelize: sequelize,
    schemas: applyPluginsToSchemas(
      config.schemas || [],
      plugins,
      buildOptions.plugin || {}
    ),
    models: {},
    services: {},
    typeConfig: (typeName) => null
  }

  const resolveContext = buildResolverContext(config.hooks || [], sgContext)
  const interfaceContext = buildInterfaceContext(sgContext)

  const context: ResolverContext & InterfaceContext & TypeContext = {
    hookFieldResolve: (name, options) =>
      resolveContext.hookFieldResolve(name, options),
    hookQueryResolve: (name, options) =>
      resolveContext.hookQueryResolve(name, options),
    hookMutationResolve: (name, options) =>
      resolveContext.hookMutationResolve(name, options),

    interface: (str) => {
      return interfaceContext.interface(str)
    },
    registerInterface: (name, gInterface) => {
      return interfaceContext.registerInterface(name, gInterface)
    },

    typeConfig: (typeName) => null
  }

  const fieldTypeContext = buildFieldTypeContext(
    config.fieldTypes || [],
    config.dataTypes || [],
    config.schemas || [],
    context
  )
  context.typeConfig = (typeName) => fieldTypeContext.typeConfig(typeName)

  sgContext.typeConfig = (typeName) => fieldTypeContext.typeConfig(typeName)
  sgContext.models = applyPluginsToModels(
    buildSequelizeModels(sequelize, config.schemas || [], sgContext),
    plugins,
    buildOptions.plugin || {}
  )

  sgContext.services = buildServices(config.services || [], sgContext)

  const rootQueries = buildRootQueries(
    [
      ...(config.schemas || []).map((schema) => schema.config.queries),
      config.queries
    ],
    context
  )
  const payloadFields: GraphQLFieldConfigMap<any, any> = {}
  const rootQueryObject = new GraphQLObjectType({
    name: 'RootQuery',
    fields: () => rootQueries
  })
  const schemaConfig: GraphQLSchemaConfig = { query: rootQueryObject }
  if (_.keys(rootQueries).length > 0) {
    payloadFields.relay = {
      description:
        'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
      type: new GraphQLNonNull(rootQueryObject),
      resolve: () => {
        return {}
      }
    }
  }

  const rootMutations = buildRootMutations(
    [
      ...(config.schemas || []).map((schema) => schema.config.mutations),
      config.mutations
    ],
    payloadFields,
    context
  )
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
