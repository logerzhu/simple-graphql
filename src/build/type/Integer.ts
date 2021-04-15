import { TypeConfig } from '../../index'
import { GraphQLInt } from 'graphql'
import Sequelize from 'sequelize'

export default {
  name: 'Integer',
  inputType: GraphQLInt,
  outputType: GraphQLInt,
  columnOptions: { type: Sequelize.INTEGER }
} as TypeConfig
