import {Sequelize} from "sequelize";
import _ from "lodash";

import {GraphQLFieldConfig, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLSchemaConfig} from "graphql";

import Schema from "../definition/Schema";
import Service from "../definition/Service";

import {
    BuildOptions,
    DataTypeOptions,
    FieldType,
    FieldTypeContext,
    HookOptions,
    InterfaceContext,
    PluginOptions,
    ResolverContext,
    SGContext
} from "../Definition";

import applyPluginsToSchemas from "./applyPluginsToSchemas";
import applyPluginsToModels from "./applyPluginsToModels";
import buildResolverContext from "./buildResolverContext";
import buildPlugins from "./buildPlugins";
import buildInterfaceContext from "./buildInterfaceContext";
import buildFieldTypeContext from "./buildFieldTypeContext";
import buildSequelizeModels from "./buildSequelizeModels";
import buildServices from "./buildServices";
import buildRootQueries from "./buildRootQueries";
import buildRootMutations from "./buildRootMutations";

export default function (sequelize: Sequelize, config: {
    dataTypes?: Array<DataTypeOptions>;
    fieldTypes?: Array<FieldType>;
    schemas?: Array<Schema>;
    services?: Array<Service>;
    hooks?: Array<HookOptions>;
    plugins?: Array<PluginOptions>;
}, buildOptions: BuildOptions): { graphQLSchema: GraphQLSchema; sgContext: SGContext; } {
    const plugins = buildPlugins(config.plugins || []);
    const sgContext: SGContext = {
        sequelize: sequelize,
        schemas: applyPluginsToSchemas(config.schemas || [], plugins, buildOptions.plugin || {}),
        models: {},
        services: {},
        fieldType: typeName => null
    };

    const resolveContext = buildResolverContext(config.hooks || [], sgContext);
    const interfaceContext = buildInterfaceContext(sgContext);

    const context: ResolverContext & InterfaceContext & FieldTypeContext = {
        hookFieldResolve: (name, options) => resolveContext.hookFieldResolve(name, options),
        hookQueryResolve: (name, options) => resolveContext.hookQueryResolve(name, options),
        hookMutationResolve: (name, options) => resolveContext.hookMutationResolve(name, options),

        interface: str => {
            return interfaceContext.interface(str);
        },
        registerInterface: (name, gInterface) => {
            return interfaceContext.registerInterface(name, gInterface);
        },

        fieldType: typeName => null
    };

    const fieldTypeContext = buildFieldTypeContext(config.fieldTypes || [], config.dataTypes || [], config.schemas || [], context);
    context.fieldType = typeName => fieldTypeContext.fieldType(typeName);

    sgContext.fieldType = typeName => fieldTypeContext.fieldType(typeName);
    sgContext.models = applyPluginsToModels(buildSequelizeModels(sequelize, config.schemas || [], sgContext), plugins, buildOptions.plugin || {});

    sgContext.services = buildServices(config.services || [], sgContext);

    const rootQueries = buildRootQueries(config.schemas || [], config.services || [], context);
    const payloadFields: {
        [key: string]: GraphQLFieldConfig<any, any>;
    } = {};
    const rootQueryObject = new GraphQLObjectType({
        name: 'RootQuery',
        fields: () => rootQueries
    });
    const schemaConfig: GraphQLSchemaConfig = {query: rootQueryObject};
    if (_.keys(rootQueries).length > 0) {
        payloadFields['relay'] = {
            description: 'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
            type: new GraphQLNonNull(rootQueryObject),
            resolve: () => {
                return {};
            }
        };
    }

    const rootMutations = buildRootMutations(config.schemas || [], config.services || [], payloadFields, context);
    if (_.keys(rootMutations).length > 0) {
        schemaConfig.mutation = new GraphQLObjectType({
            name: 'RootMutation',
            fields: () => rootMutations
        });
    }

    return {
        sgContext: sgContext,
        graphQLSchema: new GraphQLSchema(schemaConfig)
    };
}