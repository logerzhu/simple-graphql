// @flow
export const dbCfg = {
  schema: 'test1',
  user: 'postgres',
  password: 'Welcome1',
  options: {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    define: {
      underscored: true,
      underscoredAll: true
    }
  }
}
