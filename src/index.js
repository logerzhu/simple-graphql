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

import type {ModelOptionConfig, BuildOptionConfig} from './Definition'

/**
 * Usage:
 *
 * @example
 *
 * 1.Define the model
 *
 * // @flow
 * import SG from 'simple-graphql'
 *
 * const TodoType = SG.modelRef('Todo')
 *
 * export default SG.model('Todo').fields({
 *   title: {
 *     $type: String,
 *     required: true
 *   },
 *   description: String,
 *   completed: {
 *     $type: Boolean,
 *     required: true
 *   },
 *   dueAt: Date
 * }).queries({
 *   dueTodos: {
 *     description: "Find all due todos",
 *     $type: [TodoType],
 *     args: {
 *       dueBefore: {
 *         $type: Date,
 *         required: true
 *       }
 *     },
 *     resolve: async function ({ dueBefore}, context, info, {Todo}) {
 *       return Todo.find({
 *         where: {
 *           completed: false,
 *           dueAt: {
 *             $lt: dueBefore
 *           }
 *         }
 *       })
 *     }
 *   }
 * }).mutations({
 *   cpmpletedTodo: {
 *     description: "Mark the todo task completed.",
 *     inputFields: {
 *       todoId: {
 *         $type: TodoType,
 *         required: true
 *       }
 *     },
 *     outputFields: {
 *       changedTodo: TodoType
 *     },
 *     mutateAndGetPayload: async function ({todoId}, context, info, {Todo}) {
 *       const todo = await Todo.findOne({where: {id: todoId}})
 *       if (!todo) {
 *         throw new Error("Todo entity not found.")
 *       }
 *       if (!todo.completed) {
 *         todo.completed = true
 *         await todo.save()
 *       }
 *       return {changedTodo: todo}
 *     }
 *   }
 * })
 *
 * 2. Config the Sequelize database connection.
 *
 * import Sequelize from 'sequelize'
 * const sequelize = new Sequelize('test1', 'postgres', 'Password', {
 *   host: 'localhost',
 *   port: 5432,
 *   dialect: 'postgres',
 *
 *   pool: {
 *     max: 5,
 *     min: 0,
 *     idle: 10000
 *   }
 * })
 * export default sequelize
 *
 * 3. Generate the GraphQL Schema
 *
 * import SG from 'simple-graphql'
 *
 * //import Todo model and sequlize config ...
 *
 * const schema = GS.build(sequelize, [Todo], {})
 *
 * //After bulid, all sequelize models have defined, then call sequelize.sync will automatic create the schema in database.
 * sequelize.sync({
 *   force: false,
 *   logging: console.log
 * }).then(() => console.log('Init DB Done'), (err) => console.log('Init DB Fail', err))
 *
 * export default
 *
 * 4. Start the GraphQL server
 *
 * const express = require('express');
 * const graphqlHTTP = require('express-graphql');
 *
 * const app = express();
 *
 * app.use('/graphql', graphqlHTTP({
 *  schema: MyGraphQLSchema,
 *  graphiql: true
 * }));
 * app.listen(4000);
 */
const SimpleGraphQL = {

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
  ScalarFieldTypes: Type.ScalarFieldTypes,

  /**
   * Get the Relay Connction helper
   */
  Connection: Connection,

  Model: Model,

  /**
   * Define a Model
   *
   * @param name
   * @param options
   */
  model: (name:string, options:ModelOptionConfig = {}):Model => new Model(name, options),

  /**
   * @public
   * Create a model reference, which can be using on the field type definition.
   * @param name
   */
  modelRef: (name:string):ModelRef => new ModelRef(name),

  /**
   * Build the GraphQL Schema
   */
  build: (sequelize:Sequelize, models:Array<Model>, options:BuildOptionConfig = {}):graphql.GraphQLSchema => {
    const context = new Context(sequelize, options)

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

    const viewerConfig = _.get(options, 'query.viewer', 'AllQuery')
    if (viewerConfig === 'AllQuery') {
      context.graphQLObjectTypes['Viewer'] = new graphql.GraphQLObjectType({
        name: 'Viewer',
        interfaces: [context.nodeInterface],
        fields: () => {
          const fields = {
            id: {type: new graphql.GraphQLNonNull(graphql.GraphQLID)}
          }
          _.forOwn(finalQueries, (value, key) => {
            if (key !== 'viewer' && key !== 'relay') fields[key] = value
          })
          return fields
        }
      })
      finalQueries['viewer'] = {
        description: 'Default Viewer implement to include all queries.',
        type: context.graphQLObjectTypes['Viewer'],
        resolve: () => {
          return {
            _type: 'Viewer',
            id: relay.toGlobalId('Viewer', 'viewer')
          }
        }
      }
    } else if (viewerConfig === 'FromModelQuery') {
      if (!finalQueries['viewer']) {
        throw new Error('Build option has config "query.view=FromModelQuery" but query "viewer" not defined.')
      }
      // TODO check whether viewer.type is a Node
    } else {
      finalQueries['viewer'] = viewerConfig
      // TODO check whether viewer.type is a Node
    }

    finalQueries['node'] = {
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
          if (id.type === 'Viewer') {
            if (finalQueries['viewer'] && finalQueries['viewer'].resolve) {
              return finalQueries['viewer'].resolve(null, args, context, info)
            }
          }
          if (!models[id.type]) return null
          const record = await models[id.type].findOne({where: {id: id.id}})
          if (record) {
            record._type = id.type
          }
          return record
        }
      })
    }

    const rootQuery = new graphql.GraphQLObjectType({
      name: 'RootQuery',
      fields: () => {
        return finalQueries
      }
    })

    finalQueries['relay'] = {
      description: 'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
      type: new graphql.GraphQLNonNull(rootQuery),
      resolve: () => {
        return {}
      }
    }

    return new graphql.GraphQLSchema({
      query: rootQuery,
      mutation: new graphql.GraphQLObjectType({
        name: 'RootMutation',
        fields: () => {
          const fields:{[fieldName: string]: graphql.GraphQLFieldConfig<any, any>} = {}
          _.forOwn(context.mutations, (value, key) => {
            const inputFields = Transformer.toGraphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.inputFields)
            const outputFields = {}
            const payloadFields = _.get(options, 'mutation.payloadFields', [])
            for (let field of payloadFields) {
              if (typeof field === 'string') {
                if (!finalQueries[field]) {
                  throw new Error('Incorrect buildOption. Query[' + field + '] not exist.')
                }
                outputFields[field] = finalQueries[field]
              } else {
                outputFields[field.name] = field
              }
            }
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

export default SimpleGraphQL
