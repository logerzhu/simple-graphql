// @flow
export default async function (args:{
  after?: string,
  first?: number,
  before?: string,
  last?: number,
  include?:Array<any>,
  attributes?:Array<string>,
  where?:any,
  bind?:any,
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
  let {after, first = 100, before, last, include = [], where = {}, attributes, bind = [], order = [['id', 'ASC']]} = args

  if (last || before) {
    const count = await dbModel.count({
      include: include,
      where: where,
      bind: bind
    })
    first = last || 100
    before = before || (count + 1)
    after = count - (parseInt(before) - 1)
    order = order.map(o => {
      const r = [...o]
      if (typeof o[0] === 'string') {
        switch (r[r.length - 1].toLocaleUpperCase()) {
          case 'ASC':
            r[r.length - 1] = 'DESC'
            break
          case 'DESC':
            r[r.length - 1] = 'ASC'
            break
          default:
            r.push('DESC')
        }
      }
      return r
    })
    const offset = Math.max(after != null ? parseInt(after) : 0, 0)
    const rows = await dbModel.findAll({
      include: include,
      where: where,
      attributes: attributes,
      bind: bind,
      order: order,
      limit: first,
      offset: offset
    })
    let index = 0
    return {
      pageInfo: {
        startCursor: count - (offset + rows.length) + 1,
        endCursor: count - offset,
        hasPreviousPage: count - (offset + rows.length) > 0,
        hasNextPage: offset > 0
      },
      edges: rows.map(node => {
        return {
          node: node,
          cursor: count - offset - (++index) + 1
        }
      }).reverse(),
      count: count
    }
  } else {
    const offset = Math.max(after != null ? parseInt(after) : 0, 0)
    const {count, rows} = await dbModel.findAndCountAll({
      include: include,
      where: where,
      attributes: attributes,
      bind: bind,
      order: order,
      limit: first,
      offset: offset
    })
    let index = 0
    return {
      pageInfo: {
        startCursor: offset + 1,
        endCursor: offset + rows.length,
        hasPreviousPage: offset > 0,
        hasNextPage: offset + rows.length < count
      },
      edges: rows.map(node => {
        return {
          node: node,
          cursor: offset + (++index)
        }
      }),
      count: count
    }
  }
}
