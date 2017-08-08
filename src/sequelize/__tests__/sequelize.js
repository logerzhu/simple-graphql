// @flow
import Sequelize from 'sequelize'
import cls from 'continuation-local-storage'

const namespace = cls.createNamespace('my-db-namespace')
Sequelize.useCLS(namespace)

const sequelize = new Sequelize('clinic', 'tester', 'password', {
  host: 'localhost',
  dialect: 'sqlite',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  // SQLite only
  storage: 'test.sqlite',
  define: {
    underscored: true,
    underscoredAll: true
  },
  logging: true
})

export default sequelize
