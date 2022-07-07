import _ from 'lodash'
import { SGContext, SGModel, SGModelCtrl } from '../../index'
import { GraphQLResolveInfo } from 'graphql'
import { FindOptions, Order, OrderItem } from 'sequelize'
import { BindOrReplacements } from 'sequelize/types/lib/query-interface'
import { Includeable, WhereOptions } from 'sequelize/types/lib/model'
import { Selection } from './parseSelections'
import { SequelizeSGSchema } from '../../definition/SequelizeSGSchema'

const isPrimaryOrder = (
  sgContext: SGContext,
  schema: SequelizeSGSchema,
  orderConfig
) => {
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
            schema = sgContext.models[config.target].sgSchema
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

export default async function <M extends SGModel>(
  this: SGModelCtrl<M>,
  args: {
    pagination?: {
      after?: string
      first?: number
      before?: string
      last?: number
    }
    selectionInfo?: GraphQLResolveInfo
    include?: Includeable | Includeable[]
    attributes?: Array<string>
    where?: WhereOptions
    bind?: BindOrReplacements
    order?: OrderItem[]
    subQuery?: boolean
  }
): Promise<{
  pageInfo: {
    startCursor: string | number
    endCursor: string | number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  edges: Array<{
    node: M
    cursor: string | number
  }>
  count: number
}> {
  const dbModel = this
  const sgContext = dbModel.getSGContext()
  let {
    pagination = {},
    include = [],
    where = {},
    attributes,
    bind = [],
    subQuery
  } = args
  let { after, first = 100, before, last } = pagination

  const option = dbModel.resolveQueryOption({
    info: args.selectionInfo,
    path: 'edges.node',
    include: include,
    order: args.order || [['id', 'ASC']],
    attributes: attributes
  })
  include = option.include
  let order = option.order
  attributes = option.attributes

  const getSelections = (info?: GraphQLResolveInfo) => {
    if (!info) {
      return []
    }
    const fragments = info.fragments || {}
    let selections: Selection[] = []

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
    getSelections(args.selectionInfo).find(
      (s) => s.name === 'count' || s.name.startsWith('pageInfo')
    ) != null

  const getCountResult = async () => {
    if (!needCount) {
      return 0
    } else {
      return dbModel.withCache
        ? await dbModel.withCache().count({
            distinct: true,
            include: include,
            where: where
            // bind: bind  #TODO 需要测试
          })
        : await dbModel.count({
            distinct: true,
            include: include,
            where: where
            // bind: bind  #TODO 需要测试
          })
    }
  }
  const count = await getCountResult()

  if (last != null || before != null) {
    first = last || 100
    before = before || '' + (count + 1)
    after = '' + (count - (parseInt(before) - 1))
    order = order.map((orderItem) => {
      if (Array.isArray(orderItem)) {
        const revertItem = [...orderItem]
        if (isPrimaryOrder(sgContext, dbModel.sgSchema, revertItem)) {
          switch (
            (revertItem[revertItem.length - 1] as string).toLocaleUpperCase()
          ) {
            case 'ASC':
              revertItem[revertItem.length - 1] = 'DESC'
              break
            case 'DESC':
              revertItem[revertItem.length - 1] = 'ASC'
              break
            default:
              revertItem.push('DESC')
          }
        }
      }
      return orderItem
    })
  }

  const offset = Math.max(after != null ? parseInt(after) : 0, 0)

  const getRows = async function () {
    if (
      dbModel.hasSelection({
        info: args.selectionInfo,
        path: 'edges'
      })
    ) {
      const findOptions: FindOptions = {
        include: include,
        where: where,
        attributes: attributes,
        bind: bind,
        order: order,
        limit: first,
        offset: offset,
        subQuery: subQuery
      }
      return dbModel.withCache
        ? await dbModel.withCache().findAll(findOptions)
        : await dbModel.findAll(findOptions)
    }
    return []
  }
  const rows = await getRows()

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
