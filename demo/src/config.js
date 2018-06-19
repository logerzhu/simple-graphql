// @flow
// export const dbCfg = {
//   schema: 'demo1',
//   user: 'user',
//   password: 'pass',
//   options: {
//     host: 'localhost',
//     dialect: 'sqlite',
//
//     pool: {
//       max: 5,
//       min: 0,
//       idle: 10000
//     },
//     // SQLite only
//     storage: 'demo.sqlite',
//     define: {
//       underscored: true,
//       underscoredAll: true
//     }
//   }
// }

export const dbCfg = {
  schema: 'sunshine',
  user: 'root',
  password: 'y098765y', // 123456',
  options: {
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    define: {
      underscored: true,
      underscoredAll: true
    },
    logging: false
  }
}
