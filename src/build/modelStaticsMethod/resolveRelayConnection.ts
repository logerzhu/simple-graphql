import _ from 'lodash'

const isPrimaryOrder = ({ orderConfig, schema, sgContext }) => {
  if (_.isArray(orderConfig)) {
    for (let i of orderConfig) {
      if (i.model && i.as) {
        if (schema.config.associations.hasMany[i.as]) {
          return false
        } else {
          const config =
            schema.config.associations.belongsTo[i.as] ||
            schema.config.associations.hasOne[i.as]
          if (config) {
            schema = sgContext.schemas[config.target]
          } else {
            return true
          }
        }
      } else {
        return true
      }
    }
  }
  return true
}

export default async function (args: {
  pagination?: {
    after?: string
    first?: number
    before?: string
    last?: number
  }
  selectionInfo?: Object
  include?: Array<any>
  attributes?: Array<string>
  where?: any
  bind?: any
  order?: Array<Array<any>>
  subQuery?: boolean
}): Promise<{
  pageInfo: {
    startCursor: string | number
    endCursor: string | number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  edges: Array<{
    node: any
    cursor: string | number
  }>
  count: number
}> {
  const dbModel = this
  const sgContext = dbModel.getSGContext()
  let {
    pagination = {},
    selectionInfo = {},
    include = [],
    where = {},
    attributes,
    bind = [],
    order = [['id', 'ASC']],
    subQuery
  } = args
  let { after, first = 100, before, last } = pagination

  const option = dbModel.resolveQueryOption({
    info: selectionInfo,
    path: 'edges.node',
    include: include,
    order: order,
    attributes: attributes
  })
  include = option.include
  order = option.order
  attributes = option.attributes

  const getSelections = (info) => {
    const fragments = info.fragments || {}
    let selections = []

    ;(info.fieldNodes || []).forEach((node) => {
      selections = _.union(
        selections,
        dbModel.parseSelections(
          fragments,
          node.selectionSet && node.selectionSet.selections
        )
      )
    })
    return selections
  }

  // 如果需要获取后面分页 或者 count 值,才需要计算
  const needCount =
    last != null ||
    before != null ||
    getSelections(selectionInfo).find(
      (s) => s.name === 'count' || s.name.startsWith('pageInfo')
    ) != null

  const count = needCount
    ? await (dbModel.withCache ? dbModel.withCache() : dbModel).count({
        distinct: 'id',
        include: include,
        where: where,
        bind: bind,
        subQuery: subQuery
      })
    : 0

  if (last != null || before != null) {
    first = last || 100
    before = before || count + 1
    after = '' + (count - (parseInt(before) - 1))
    order = order.map((o) => {
      const r = [...o]
      if (
        isPrimaryOrder({
          orderConfig: r,
          schema: sgContext.schemas[dbModel.name],
          sgContext: sgContext
        })
      ) {
        // TODO Need to hand order field is null case
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
  }

  const offset = Math.max(after != null ? parseInt(after) : 0, 0)
  const rows = dbModel.hasSelection({
    info: selectionInfo,
    path: 'edges'
  })
    ? await (dbModel.withCache ? dbModel.withCache() : dbModel).findAll({
        distinct: 'id',
        include: include,
        where: where,
        attributes: attributes,
        bind: bind,
        order: order,
        limit: first,
        offset: offset,
        subQuery: subQuery
      })
    : []
  let index = 0
  if (last || before) {
    return {
      pageInfo: {
        startCursor: count - (offset + rows.length) + 1,
        endCursor: count - offset,
        hasPreviousPage: count - (offset + rows.length) > 0,
        hasNextPage: offset > 0
      },
      edges: rows
        .map((node) => {
          return {
            node: node,
            cursor: count - offset - ++index + 1
          }
        })
        .reverse(),
      count: count
    }
  } else {
    return {
      pageInfo: {
        startCursor: offset + 1,
        endCursor: offset + rows.length,
        hasPreviousPage: offset > 0,
        hasNextPage: offset + rows.length < count
      },
      edges: rows.map((node) => {
        return {
          node: node,
          cursor: offset + ++index
        }
      }),
      count: count
    }
  }
}
