// @flow
import type { FieldType } from '../../Definition'
import { GraphQLInt } from 'graphql'
import Sequelize from 'sequelize'

export default ({
  name: 'Integer',
  inputType: GraphQLInt,
  outputType: GraphQLInt,
  columnOptions: { type: Sequelize.INTEGER }
}: FieldType)
