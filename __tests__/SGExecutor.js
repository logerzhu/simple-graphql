// @flow
import { graphql, GraphQLSchema } from 'graphql'
import type { BuildOptions, FieldType, HookOptions, PluginOptions, SGContext } from '../src/Definition'
import SG from '../src'
import cls from 'continuation-local-storage'
import Sequelize from 'sequelize'

const namespace = cls.createNamespace('db-transaction-nsp');

(Sequelize: any).useCLS(namespace)

const getDbConfig = () => {
  return {
    schema: 'test',
    user: 'user',
    password: 'pass',
    options: {
      host: 'localhost',
      dialect: 'sqlite',
      pool: {
        max: 5,
        min: 0,
        idle: 10000
      },
      // SQLite only
      storage: ':memory:',
      logging: (s: string) => { }
    }
  }
}

const sequelizeInstance = function (dbConfig) {
  return new Sequelize(dbConfig.schema, dbConfig.user, dbConfig.password, dbConfig.options)
}

class SGExecutor {
  static new: (config: {
    fieldTypes?: Array<FieldType>,
    schemas?: Array<SG.Schema>,
    services?: Array<SG.Service>,
    hooks?: Array<HookOptions>,
    plugins?: Array<PluginOptions>
  }, buildOptions: BuildOptions)=>Promise<SGExecutor>

  graphQLSchema: GraphQLSchema
  sgContext: SGContext

  constructor (options: {
    graphQLSchema: GraphQLSchema,
    sgContext: SGContext
  }) {
    this.graphQLSchema = options.graphQLSchema
    this.sgContext = options.sgContext
  }

  async exec (query: string, variables?: any = {}) {
    return graphql(this.graphQLSchema, query, {}, {}, variables)
  }
}

SGExecutor.new = async function (config: {
  fieldTypes?: Array<FieldType>,
  schemas?: Array<SG.Schema>,
  services?: Array<SG.Service>,
  hooks?: Array<HookOptions>,
  plugins?: Array<PluginOptions>
}, buildOptions: BuildOptions) {
  const sequelize = sequelizeInstance(getDbConfig())
  const result = SG.build(sequelize, config, buildOptions)
  await sequelize.sync({
    force: true
  })
  return new SGExecutor(result)
}

export default SGExecutor
