//@flow
import Sequelize from 'sequelize'
import * as graphql from "graphql"
import  type {GraphQLInputType,GraphQLOutputType} from "graphql"

export type ScalarFieldTypeConfig ={
  name:string,
  description?:string,
  graphQLInputType:GraphQLInputType,
  graphQLOutputType:GraphQLOutputType,
  columnType:string | Sequelize.DataType
}

export default class ScalarFieldType {
  name:string
  description:?string

  graphQLInputType:GraphQLInputType

  graphQLOutputType:GraphQLOutputType

  columnType:string | Sequelize.DataType

  constructor(config:ScalarFieldTypeConfig) {
    this.name = config.name
    this.description = config.description
    this.graphQLInputType = config.graphQLInputType
    this.graphQLOutputType = config.graphQLOutputType
    this.columnType = config.columnType
  }
}