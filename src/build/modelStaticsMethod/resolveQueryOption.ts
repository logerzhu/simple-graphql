import _ from 'lodash'
import {GraphQLResolveInfo} from 'graphql'
import {SequelizeSGSchema} from '../../definition/SequelizeSGSchema'
import {Selection} from './parseSelections'
import {Order, OrderItem} from 'sequelize'
import {Includeable, IncludeOptions} from 'sequelize/types/lib/model'
import {SGContext, SGModel, SGModelCtrl} from '../../index'

function fieldToSelection(field: string) {
  const index = field.indexOf('.')
  if (index === -1) {
    return {name: field}
  } else {
    return {
      name: field.substr(0, index),
      selections: [fieldToSelection(field.substr(index + 1))]
    }
  }
}

function getOrderFields(order: Order): string[] {
  if (Array.isArray(order)) {
    return order
      .map((orderItem) => {
        if (Array.isArray(orderItem)) {
          const column = orderItem[0]
          if (typeof column === 'string') {
            return column
          }
        }
        //避免null的检查
        return '&#$&'
      })
      .filter((orderItem) => orderItem !== '&#$&')
  } else {
    return []
  }
}

/*
 排序设置中的字段, 如果是["a.b.c", "desc"]格式, 转换成
 [{ model: A; as: 'a' }, { model: B; as: 'b' } ,"c","desc"]
 */
function convertOrderItem(
  sgContext: SGContext,
  schema: SequelizeSGSchema,
  orderItem: [string, any]
) {
  const [column, sort] = orderItem

  const [first, ...other] = column.split('.')
  const ass = schema.config.associations
  const iConfig =
    ass.belongsTo[first] || ass.hasOne[first] || ass.hasMany[first]
  if (iConfig) {
    const model = sgContext.models[iConfig.target]
    return [
      {
        model: model,
        as: first
      },
      ...convertOrderItem(sgContext, model.sgSchema, [
        other.join('.'),
        sort
      ])
    ]
  } else {
    return orderItem
  }
}

function convertOrder(
  sgContext: SGContext,
  schema: SequelizeSGSchema,
  order: Order,
  parents: { model: SGModelCtrl; as: string }[]
): OrderItem[] {
  function patchParent(item): OrderItem {
    if (Array.isArray(item)) {
      return [...parents, ...item] as OrderItem
    } else {
      return [...parents, item] as any
    }
  }

  if (Array.isArray(order)) {
    return order.map((orderItem) => {
      if (Array.isArray(orderItem)) {
        const [column, sort] = orderItem
        if (typeof column === 'string') {
          return patchParent(
            convertOrderItem(sgContext, schema, [column, sort])
          )
        } else {
          return patchParent(orderItem)
        }
      } else {
        return patchParent([orderItem])
      }
    })
  }
  return [patchParent(order)]
}

const buildQueryOption = function (args: {
  sgContext: SGContext
  schema: SequelizeSGSchema
  include: Includeable | Includeable[]
  attributes?: string[]
  selections?: Selection[]
  eagerHasMany: boolean
  parents?: { model: SGModelCtrl; as: string }[]
}) {
  const {
    sgContext,
    schema,
    attributes,
    selections,
    eagerHasMany,
    parents = []
  } = args

  const parseAttributesOption = sgContext.models[schema.name].parseAttributes({
    attributes: attributes || [],
    selections: selections
  })

  let additionOrder: OrderItem[] = []

  const include = (() => {
    const copy = (i: Includeable): Includeable => {
      if (typeof i === 'object' && (i as IncludeOptions).as != null) {
        return {...i}
      } else {
        return i
      }
    }
    if (Array.isArray(args.include)) {
      return args.include.map((i) => copy(i))
    } else if (args.include) {
      return [copy(args.include)]
    } else {
      return []
    }
  })()

  for (let selection of [
    ...(selections || []),
    ...parseAttributesOption.additionSelections
  ]) {
    const hasOneOrBelongsToConfig =
      schema.config.associations.belongsTo[selection.name] ||
      schema.config.associations.hasOne[selection.name]

    const hasManyConfig = schema.config.associations.hasMany[selection.name]

    let config = hasOneOrBelongsToConfig

    if (!hasOneOrBelongsToConfig && eagerHasMany) {
      if (
        hasManyConfig?.outputStructure === 'Array' &&
        (hasManyConfig.conditionFields == null ||
          _.keys(hasManyConfig.conditionFields).length === 0)
      ) {
        config = hasManyConfig
        // add hasManyConfig order config
        const targetModel = sgContext.models[hasManyConfig.target]
        additionOrder.push(
          ...convertOrder(
            sgContext,
            targetModel.sgSchema,
            hasManyConfig.order || [['id', 'ASC']],
            [
              {
                model: targetModel,
                as: selection.name
              }
            ]
          )
        )
      }
    }

    if (config) {
      const exit: IncludeOptions | undefined = (() => {
        return include.find(
          (i) => (i as IncludeOptions).as === selection.name
        ) as IncludeOptions
      })()

      const targetModel = sgContext.models[config.target]

      const option = buildQueryOption({
        sgContext: sgContext,
        attributes: (exit?.attributes as string[]) || [], //TODO
        include: exit?.include || [],
        schema: targetModel.sgSchema,
        selections: selection.selections,
        parents: [
          ...parents,
          {
            model: targetModel,
            as: selection.name
          }
        ],
        eagerHasMany: eagerHasMany
      })

      if (exit) {
        exit.include = option.include
        exit.attributes = option.attributes
        additionOrder = _.unionBy(
          additionOrder,
          option.additionOrder,
          JSON.stringify
        )
      } else {
        include.push({
          model: sgContext.models[config.target],
          as: selection.name,
          include: option.include,
          attributes: option.attributes,
          required: false
        })
        additionOrder = _.unionBy(
          additionOrder,
          option.additionOrder,
          JSON.stringify
        )
      }
    }
  }

  return {
    include: include,
    attributes: parseAttributesOption.attributes,
    additionOrder: additionOrder
  }
}

export default function <M extends SGModel>(
  this: SGModelCtrl<M>,
  args: {
    attributes?: Array<string>
    include?: Includeable | Includeable[]
    order?: Order
    info?: GraphQLResolveInfo
    path?: string
    eagerHasMany?: boolean
  }
): {
  include: Includeable | Includeable[]
  attributes: Array<string>
  order: OrderItem[]
} {
  const dbModel = this
  const {
    include = [],
    attributes = [],
    order = [],
    info,
    path,
    eagerHasMany = true
  } = args
  const fragments = info?.fragments || {}

  const sgContext = this.getSGContext()

  let selections: Selection[] = []

  if (info?.fieldNodes) {
    info.fieldNodes.forEach((node) => {
      selections = _.union(
        selections,
        dbModel.parseSelections(
          fragments,
          node.selectionSet && node.selectionSet.selections
        )
      )
    })
  }

  if (path) {
    path.split('.').forEach((p) => {
      selections = _.flatten(
        selections.filter((s) => s.name === p).map((t) => t.selections || [])
      )
    })
  }

  selections = [
    ...selections,
    ..._.union(attributes || [], getOrderFields(order)).map((field) =>
      fieldToSelection(field)
    )
  ]

  const mainOrder = convertOrder(
    sgContext,
    dbModel.sgSchema,
    order,
    []
  )

  const option = buildQueryOption({
    sgContext: sgContext,
    include: include,
    schema: dbModel.sgSchema,
    selections: selections,
    eagerHasMany: eagerHasMany
  })

  // console.log(require('util').inspect(option, {depth: 20}))
  return {
    include: option.include,
    attributes: option.attributes,
    order: _.unionBy(mainOrder, option.additionOrder, JSON.stringify)
  }
}
