import { GraphQLInterfaceType } from 'graphql'
import { fromGlobalId, nodeDefinitions } from 'graphql-relay'
import { SGInterfaceContext, SGContext } from '../index'

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
        if (typeConfig) {
          return typeConfig.outputType
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
