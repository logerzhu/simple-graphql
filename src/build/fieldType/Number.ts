import { FieldType } from '../../Definition'
import { GraphQLFloat } from 'graphql'
import Sequelize from 'sequelize'

export default {
  name: 'Number',
  inputType: GraphQLFloat,
  outputType: GraphQLFloat,
  columnOptions: { type: Sequelize.DOUBLE }
} as FieldType
