// @flow
export default async function (args:{
  after?: string,
  first?: number,
  before?: string,
  last?: number,
  include?:Array<any>,
  where?:any,
  order?: Array<Array<any>>
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
  const dbModel = this
  let {after, first = 100, before, last, include = [], where = {}, order = [['id', 'ASC']]} = args
  let reverse = false

  const count = await dbModel.count({
    include: include,
    where: where
  })

  if (last || before) {
    reverse = true
    first = last || 100
    before = before || (count + 1)
    after = count - (parseInt(before) - 1)
    order = order.map(o => {
      return [o[0], (o[1] || '').toLocaleUpperCase() === 'ASC' ? 'DESC' : 'ASC']
    })
  }
  const offset = Math.max(after != null ? parseInt(after) : 0, 0)

  const result = await dbModel.findAll({
    include: include,
    where: where,
    order: order,
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
