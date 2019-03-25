// @flow
import type { GraphQLInputType, GraphQLOutputType } from 'graphql'
import type { DataTypeAbstract } from 'sequelize'

export default class ScalarFieldType {
  name:string
  description:?string

  graphQLInputType:GraphQLInputType

  graphQLOutputType:GraphQLOutputType

  columnType:string | DataTypeAbstract

  constructor (config:{
    name:string,
    description?:string,
    graphQLInputType:GraphQLInputType,
    graphQLOutputType:GraphQLOutputType,
    columnType:string | DataTypeAbstract
  }) {
    this.name = config.name
    this.description = config.description
    this.graphQLInputType = config.graphQLInputType
    this.graphQLOutputType = config.graphQLOutputType
    this.columnType = config.columnType
  }
}
