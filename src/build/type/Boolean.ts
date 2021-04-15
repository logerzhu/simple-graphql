import Sequelize from 'sequelize'
import { GraphQLBoolean } from 'graphql'
import { TypeConfig } from '../../index'

export default {
  name: 'Boolean',
  inputType: GraphQLBoolean,
  outputType: GraphQLBoolean,
  columnOptions: { type: Sequelize.BOOLEAN }
} as TypeConfig
