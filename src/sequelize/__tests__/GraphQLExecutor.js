// @flow
import {graphql} from 'graphql'
import schema from './schema'
export default class GraphQLExec {
  rootValue:any
  context:any

  constructor (context:Object = {}) {
    this.rootValue = {}
    this.context = context
  }

  async exec (query:string, variables?:any = {}) {
    return graphql(schema, query, this.rootValue, this.context, variables)
  }
}
