// @flow
import Sequelize from 'sequelize'
import ModelRef from './ModelRef'

export class ConnectionType {
  nodeType:ModelRef

  constructor (nodeType:ModelRef) {
    this.nodeType = nodeType
  }
}

export class EdgeType {
  nodeType:ModelRef

  constructor (nodeType:ModelRef) {
    this.nodeType = nodeType
  }
}

/**
 * Relay Connection Helper
 *
 * @example
 * import SG from 'simple-graphql'
 * const UserType = GS.modelRef('User')
 * export default GS.model('User', {}).fields({
 *   firstName: String,
 *   lastName: String
 * }).queries({
 *   searchUsers: {
 *     description: 'Search users by firstName',
 *     $type: GS.Connection.connectionType(UserType),
 *     args: {
 *       ...GS.Connection.args,
 *       condition: {
 *         firstName: String
 *       }
 *     },
 *     resolve: async function (args, context, info, {User}) {
 *       return GS.Connection.resolve(User, args)
 *     }
 *   }
 * })
 */
export default{

  ConnectionType: ConnectionType,

  EdgeType: EdgeType,

  /**
   * Reference to relay ConnectionType with specify node
   */
  connectionType (nodeType:ModelRef): ConnectionType {
    return new this.ConnectionType(nodeType)
  },

  /**
   * Reference to Relay EdgeType with specify node
   */
  edgeType (nodeType:ModelRef): EdgeType {
    return new this.EdgeType(nodeType)
  },

  /**
   * Return Relay Connection args definition.
   */
  args: ({
    after: {
      $type: String,
      description: '返回的记录应该在cursor:after之后'
    },
    first: {
      $type: Number,
      description: '指定最多返回记录的数量'
    },
    before: {
      $type: String
    },
    last: {
      $type: Number
    }
  }),

  /**
   * Query the model with specify args and return the connection data
   */
  resolve: async function (model:Sequelize.Model, args:{
    after?: string,
    first?: number,
    before?: string,
    last?: number,
    condition?:any,
    sort?: Array<{field: string, order: "ASC"|"DESC"}>
  }):Promise<{
    pageInfo: {
      hasPreviousPage: boolean,
      hasNextPage: boolean
    },
    edges:Array<{
      node:any,
      cursor:string|number
    }>,
    count: number
  } > {
    let {after, first = 100, before, last, condition = {}, sort = [{field: 'id', order: 'ASC'}]} = args
    let reverse = false

    const count = await model.count({
      $where: condition
    })

    if (last || before) {
      reverse = true
      first = last || 100
      after = count - (parseInt(before) - 1)
      sort = sort.map(s => {
        return {
          field: s.field,
          order: (s.order === 'ASC' ? 'DESC' : 'ASC')
        }
      })
    }
    const offset = Math.max(after != null ? parseInt(after) : 0, 0)

    const result = await model.findAll({
      where: condition,
      order: sort.map(s => [s.field, s.order]),
      limit: first,
      offset: offset
    })

    let index = 0
    return {
      pageInfo: {
        hasPreviousPage: offset > 0,
        hasNextPage: offset + result.length < count
      },
      edges: reverse ? result.map(node => {
        return {
          node: node,
          cursor: count - (offset + (index++))
        }
      }).reverse() : result.map(node => {
        return {
          node: node,
          cursor: offset + (++index)
        }
      }),
      count: count
    }
  }
}
