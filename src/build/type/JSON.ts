import Sequelize from 'sequelize'
import GraphQLScalarTypes from './graphql'
import { TypeConfig } from '../../index'

export default {
  name: 'JSON',
  inputType: GraphQLScalarTypes.Json,
  outputType: GraphQLScalarTypes.Json,
  columnOptions: { type: Sequelize.JSON }
} as TypeConfig
