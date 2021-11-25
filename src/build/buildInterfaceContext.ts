import { GraphQLInterfaceType } from 'graphql'
import { fromGlobalId, nodeDefinitions } from 'graphql-relay'
import { SGInterfaceContext, SGContext } from '..'
import { GraphQLObjectType } from 'graphql/type/definition'

export default (context: SGContext): SGInterfaceContext => {
  const interfaces: {
    [key: string]: GraphQLInterfaceType
  } = {
    Node: nodeDefinitions(
      (globalId) => {
        const { type, id } = fromGlobalId(globalId)
        console.log(
          'Warning-------------------- node id Fetcher not implement' +
            type +
            ' ' +
            id
        )
      },
      (obj) => {
        const type = obj._fieldType
        const typeConfig = context.typeConfig(type)
        if (typeConfig?.outputType) {
          return typeConfig.outputType as GraphQLObjectType
        }
        throw new Error(`Type ${type} not exist.`)
      }
    ).nodeInterface
  }
  return {
    interface: (str) => {
      return interfaces[str]
    },
    registerInterface: (name, gInterface) => {
      interfaces[name] = gInterface
    }
  }
}
