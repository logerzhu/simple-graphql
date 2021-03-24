import { graphql, GraphQLSchema } from 'graphql'
import {
  BuildOptions,
  DataTypeConfig,
  FieldTypeConfig,
  HookConfig,
  PluginConfig,
  SGContext
} from '../src/Definition'
import SG, { Schema, Service } from '../src'
import cls from 'cls-hooked'
import Sequelize from 'sequelize'

const namespace = cls.createNamespace('db-transaction-nsp')

;(Sequelize as any).useCLS(namespace)

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
      logging: (s: string) => {}
    }
  }
}

const sequelizeInstance = function (dbConfig) {
  return new Sequelize.Sequelize(
    dbConfig.schema,
    dbConfig.user,
    dbConfig.password,
    dbConfig.options
  )
}

class SGExecutor {
  static new: (
    config: {
      dataTypes?: Array<DataTypeConfig>
      fieldTypes?: Array<FieldTypeConfig>
      schemas?: Array<Schema>
      services?: Array<Service>
      hooks?: Array<HookConfig>
      plugins?: Array<PluginConfig>
    },
    buildOptions: BuildOptions
  ) => Promise<SGExecutor>

  graphQLSchema: GraphQLSchema
  sgContext: SGContext

  constructor(options: { graphQLSchema: GraphQLSchema; sgContext: SGContext }) {
    this.graphQLSchema = options.graphQLSchema
    this.sgContext = options.sgContext
  }

  async exec(query: string, variables: any = {}) {
    return graphql(this.graphQLSchema, query, {}, {}, variables)
  }
}

SGExecutor.new = async function (config, buildOptions) {
  const sequelize = sequelizeInstance(getDbConfig())
  const result = SG.build(sequelize, config, buildOptions)
  await sequelize.sync({
    force: true
  })
  return new SGExecutor(result)
}

export default SGExecutor
