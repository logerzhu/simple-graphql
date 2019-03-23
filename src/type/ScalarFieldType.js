// @flow
import Sequelize from 'sequelize'
import type { GraphQLInputType, GraphQLOutputType } from 'graphql'

export default class ScalarFieldType {
  name:string
  description:?string

  graphQLInputType:GraphQLInputType

  graphQLOutputType:GraphQLOutputType

  columnType:string | Sequelize.DataType

  constructor (config:{
    name:string,
    description?:string,
    graphQLInputType:GraphQLInputType,
    graphQLOutputType:GraphQLOutputType,
    columnType:string | Sequelize.DataType
  }) {
    this.name = config.name
    this.description = config.description
    this.graphQLInputType = config.graphQLInputType
    this.graphQLOutputType = config.graphQLOutputType
    this.columnType = config.columnType
  }
}
