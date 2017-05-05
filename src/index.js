// @flow

import Sequelize from 'sequelize'
import _ from 'lodash'

import * as graphql from 'graphql'
import * as relay from 'graphql-relay'

import Model from './Model'
import Type from './type'
import Context from './Context'
import StringHelper from './utils/StringHelper'
import Connection from './Connection'
import ModelRef from './ModelRef'
import Transformer from './transformer'

/**
 */
export default {

  /** Available values:
   * <table style='text-align: left'>
   *   <tr><th>Name</th><th>GraphQL Type</th><th>DB Type</th></tr>
   *   <tr><td>Id</td><td>GraphQLID</td><td>Sequelize.INTEGER</td></tr>
   *   <tr><td>String</td><td>GraphQLString</td><td>Sequelize.STRING</td></tr>
   *   <tr><td>Float</td><td>GraphQLFloat</td><td>Sequelize.DOUBLE</td></tr>
   *   <tr><td>Int</td><td>GraphQLInt</td><td>Sequelize.INTEGER</td></tr>
   *   <tr><td>Boolean</td><td>GraphQLBoolean</td><td>Sequelize.BOOLEAN</td></tr>
   *   <tr><td>Date</td><td>GraphQLScalarTypes.Date</td><td>Sequelize.DATE</td></tr>
   *   <tr><td>JSON</td><td>GraphQLScalarTypes.Json</td><td>Sequelize.JSONB</td></tr>
   * </table>
   *
   */
  ScalarFieldTypes: (Type.ScalarFieldTypes:{
    Id:Type.ScalarFieldType
  }),

  /**/
  Connection: Connection,

  Model: Model,

  /**
   * Define a Model
   *
   * @param name
   * @param options
   */
  model: (name:string, options:{[id:string]: any} = {}):Model => new Model(name, options),

  /**
   * @public
   * Create a model reference, which can be using on the field type definition.
   * @param name
   */
  modelRef: (name:string):ModelRef => new ModelRef(name),

  /**
   * Build the GraphQL Schema
   */
  build: (sequelize:Sequelize, models:Array<Model>, options:any):graphql.GraphQLSchema => {
    const context = new Context(sequelize)

    // 添加Model
    models.forEach(model => {
      context.addModel(model)
    })

    context.buildModelAssociations()

    const finalQueries:{[fieldName: string]: graphql.GraphQLFieldConfig<any, any>} = {}

    _.forOwn(context.queries, (value, key) => {
      finalQueries[key] = {
        type: Transformer.toGraphQLFieldConfig(
          key,
          'Payload',
          value.$type,
          context).type,
        resolve: context.wrapQueryResolve(value),
        description: value.description
      }
      if (value.args) {
        finalQueries[key].args = Transformer.toGraphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.args)
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
      resolve: context.wrapQueryResolve({
        name: 'node',
        $type: context.nodeInterface,
        resolve: async function (args, context, info, models, invoker) {
          const id = relay.fromGlobalId(args.id)
          if (!models[id.type]) return null
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
      id: relay.toGlobalId('Viewer', 'viewer')
    }

    const viewerType = new graphql.GraphQLObjectType({
      name: 'Viewer',
      interfaces: [context.nodeInterface],
      fields: () => {
        return Object.assign({
          id: {type: new graphql.GraphQLNonNull(graphql.GraphQLID)},
          node: nodeConfig
        }, finalQueries)
      }
    })

    return new graphql.GraphQLSchema({
      query: new graphql.GraphQLObjectType({
        name: 'RootQuery',
        fields: () => {
          return Object.assign({
            viewer: {
              type: viewerType,
              resolve: () => viewerInstance
            },
            node: nodeConfig
          }, finalQueries)
        }
      }),
      mutation: new graphql.GraphQLObjectType({
        name: 'RootMutation',
        fields: () => {
          const fields:{[fieldName: string]: graphql.GraphQLFieldConfig<any, any>} = {}
          _.forOwn(context.mutations, (value, key) => {
            const inputFields = Transformer.toGraphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.inputFields)
            const outputFields = {viewer: {type: viewerType, resolve: () => viewerInstance}}
            _.forOwn(value.outputFields, (fValue, fKey) => {
              outputFields[fKey] = Transformer.toGraphQLFieldConfig(
                key + '.' + fKey,
                'Payload',
                fValue,
                context
              )
            })
            if (!value['name']) {
              value['name'] = key
            }
            fields[key] = Transformer.mutationWithClientMutationId({
              name: StringHelper.toInitialUpperCase(key),
              inputFields: inputFields,
              outputFields: outputFields,
              mutateAndGetPayload: context.wrapMutateAndGetPayload(value),
              description: value.doc
            })
          })
          return fields
        }
      })
    })
  }
}
