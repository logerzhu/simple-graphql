import { GraphQLID } from 'graphql'
import Sequelize from 'sequelize'
import { SGTypeConfig } from '../../index'

export default {
  name: 'Id',
  inputType: GraphQLID,
  outputType: GraphQLID,
  columnOptions: { type: Sequelize.INTEGER }
} as SGTypeConfig
