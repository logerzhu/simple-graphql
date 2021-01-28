import { FieldType } from '../../Definition'
import Sequelize from 'sequelize'
import GraphQLScalarTypes from './graphql'

export default {
  name: 'Date',
  inputType: GraphQLScalarTypes.Date,
  outputType: GraphQLScalarTypes.Date,
  columnOptions: { type: Sequelize.DATE(6) }
} as FieldType
