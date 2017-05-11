// @flow
export const dbCfg = {
  schema: 'demo1',
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
    storage: 'demo.sqlite',
    define: {
      underscored: true,
      underscoredAll: true
    }
  }
}
