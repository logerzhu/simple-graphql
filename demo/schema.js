// @flow
import buildSchema from './buildSchema'
import sequelize from './sequelize'

export default buildSchema(sequelize).graphQLSchema
