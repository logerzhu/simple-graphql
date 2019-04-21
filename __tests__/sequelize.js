import Sequelize from 'sequelize'
import cls from 'continuation-local-storage'

const dbCfg = {
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
    logging: (s: string) => { console.log(s) }
  }
}

// 参考: http://docs.sequelizejs.com/manual/tutorial/transactions.html#automatically-pass-transactions-to-all-queries
// 通过 cls 实现 DB transaction的自动嵌套传递, 配合 /src/definition/hook/TransactionHook.js 可以为所有mutation开启transaction
const namespace = cls.createNamespace('db-transaction-nsp')
Sequelize.useCLS(namespace)

export default new Sequelize(dbCfg.schema, dbCfg.user, dbCfg.password, dbCfg.options)
