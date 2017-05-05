// @flow
import Sequelize from 'sequelize'
import SG from './index'
/**
 *dd
 */
export default{
  ConnectionType: class {
    nodeType:SG.ModelRef

    constructor (nodeType:SG.ModelRef) {
      this.nodeType = nodeType
    }
  },

  EdgeType: class {
    nodeType:SG.ModelRef

    constructor (nodeType:SG.ModelRef) {
      this.nodeType = nodeType
    }
  },

  connectionType (nodeType:SG.ModelRef) {
    return new this.ConnectionType(nodeType)
  },

  edgeType (nodeType:SG.ModelRef) {
    return new this.EdgeType(nodeType)
  },

  args: {
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
  },

  resolve: async function (model:Sequelize.Model, args:{
    after?: string,
    first?: number,
    before?: string,
    last?: number,
    condition?:any,
    sort?: Array<{field: string, order: "ASC"|"DESC"}>
  }) {
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
