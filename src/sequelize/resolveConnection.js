// @flow
import Sequelize from 'sequelize'

export default async function resolveConnection (dbModel:Sequelize.Model, args:{
  after?: string,
  first?: number,
  before?: string,
  last?: number,
  include?:Array<any>,
  condition?:any,
  sort?: Array<{field: string, order: "ASC"|"DESC"}>
}):Promise<{
  pageInfo: {
    startCursor:string|number,
    endCursor:string|number,
    hasPreviousPage: boolean,
    hasNextPage: boolean
  },
  edges:Array<{
    node:any,
    cursor:string|number
  }>,
  count: number
}> {
  let {after, first = 100, before, last, include = [], condition = {}, sort = [{
    field: 'id',
    order: 'ASC'
  }]} = args
  let reverse = false

  const count = await dbModel.count({
    include: include,
    where: condition
  })

  if (last || before) {
    reverse = true
    first = last || 100
    before = before || (count + 1)
    after = count - (parseInt(before) - 1)
    sort = sort.map(s => {
      return {
        field: s.field,
        order: (s.order === 'ASC' ? 'DESC' : 'ASC')
      }
    })
  }
  const offset = Math.max(after != null ? parseInt(after) : 0, 0)

  const result = await dbModel.findAll({
    include: include,
    where: condition,
    order: sort.map(s => [s.field, s.order]),
    limit: first,
    offset: offset
  })

  let index = 0
  if (reverse) {
    return {
      pageInfo: {
        startCursor: count - (offset + result.length) + 1,
        endCursor: count - offset,
        hasPreviousPage: count - (offset + result.length) > 0,
        hasNextPage: offset > 0
      },
      edges: result.map(node => {
        return {
          node: node,
          cursor: count - offset - (++index) + 1
        }
      }).reverse(),
      count: count
    }
  } else {
    return {
      pageInfo: {
        startCursor: offset + 1,
        endCursor: offset + result.length,
        hasPreviousPage: offset > 0,
        hasNextPage: offset + result.length < count
      },
      edges: result.map(node => {
        return {
          node: node,
          cursor: offset + (++index)
        }
      }),
      count: count
    }
  }
}
