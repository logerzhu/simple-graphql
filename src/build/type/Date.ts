import Sequelize from 'sequelize'
import GraphQLScalarTypes from './graphql'
import { TypeConfig } from '../../index'

export default {
  name: 'Date',
  inputType: GraphQLScalarTypes.Date,
  outputType: GraphQLScalarTypes.Date,
  columnOptions: { type: Sequelize.DATE(6) }
} as TypeConfig
