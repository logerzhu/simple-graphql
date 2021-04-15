import { GraphQLString } from 'graphql'
import Sequelize from 'sequelize'
import { TypeConfig } from '../../index'

export default {
  name: 'String',
  inputType: GraphQLString,
  outputType: GraphQLString,
  columnOptions: { type: Sequelize.STRING }
} as TypeConfig
