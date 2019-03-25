import _ from 'lodash'

const fieldToSelection = (field) => {
  const index = field.indexOf('.')
  if (index === -1) { return { name: field } } else {
    return {
      name: field.substr(0, index),
      selections: [fieldToSelection(field.substr(index + 1))]
    }
  }
}

const convertOrder = ({ orderPaths = [], schema, order, sgContext }) => {
  order = order || []
  return order.map(p => {
    const mapField = (iSchema, iField) => {
      const [first, ...other] = iField.split('.')

      const ass = iSchema.config.associations

      const iConfig = ass.belongsTo[first] || ass.hasOne[first] || ass.hasMany[first]
      if (iConfig) {
        return [{
          model: sgContext.models[iConfig.target],
          as: first
        }, ...mapField(sgContext.schemas[iConfig.target], other.join('.'))]
      } else {
        return [iField]
      }
    }

    const [first, ...other] = p
    if (typeof first === 'string') {
      return [...orderPaths, ...mapField(schema, first), ...other]
    } else {
      return [...orderPaths, first, ...other]
    }
  })
}

const buildQueryOption = function ({ sgContext, attributes, include, schema, selections, orderPaths, eagerHasMany }) {
  const parseAttributesOption = sgContext.models[schema.name].parseAttributes({
    attributes: attributes,
    selections: selections
  })
  selections = [...(selections || []), ...parseAttributesOption.additionSelections]

  let additionOrder = []
  for (let selection of selections) {
    let config = schema.config.associations.belongsTo[selection.name] || schema.config.associations.hasOne[selection.name]
    const hasManyConfig = schema.config.associations.hasMany[selection.name]

    if (!config && eagerHasMany) {
      if (hasManyConfig && hasManyConfig.outputStructure === 'Array' &&
        (hasManyConfig.conditionFields == null || hasManyConfig.conditionFields.length === 0)) {
        config = hasManyConfig

        // add hasManyConfig order config
        additionOrder = [...additionOrder, ...convertOrder({
          orderPaths: [...orderPaths, {
            model: sgContext.models[config.target],
            as: selection.name
          }],
          schema: sgContext.schemas[config.target],
          order: (config.order || [['id', 'ASC']]),
          sgContext: sgContext
        })
        ]
      }
    }
    if (config) {
      const exit = include.filter(i => i.as === selection.name)[0]
      if (exit) {
        const option = buildQueryOption({
          sgContext: sgContext,
          attributes: exit.attributes || [],
          include: exit.include || [],
          schema: sgContext.schemas[config.target],
          selections: selection.selections,
          orderPaths: [...orderPaths, {
            model: sgContext.models[config.target],
            as: selection.name
          }],
          eagerHasMany: eagerHasMany
        })
        exit.include = option.include
        exit.attributes = option.attributes
        additionOrder = _.unionBy(additionOrder, option.additionOrder, JSON.stringify)
      } else {
        const option = buildQueryOption({
          sgContext: sgContext,
          attributes: [],
          include: [],
          schema: sgContext.schemas[config.target],
          selections: selection.selections,
          orderPaths: [...orderPaths, {
            model: sgContext.models[config.target],
            as: selection.name
          }],
          eagerHasMany: eagerHasMany
        })
        include.push({
          model: sgContext.models[config.target],
          as: selection.name,
          include: option.include,
          attributes: option.attributes,
          required: false
        })
        additionOrder = _.unionBy(additionOrder, option.additionOrder, JSON.stringify)
      }
    }
  }

  return {
    include: include,
    attributes: parseAttributesOption.attributes,
    additionOrder: additionOrder
  }
}

export default function (args:{
  attributes?:Array<string>,
  include?:Array<any>,
  order?: Array<Array<any>>,
  info:Object,
  path?:string}) {
  const dbModel = this
  const { include = [], attributes = [], order = [], info, path } = args
  const fragments = info.fragments || []

  const sgContext = this.getSGContext()

  let selections = [];

  (info.fieldNodes || []).forEach(node => {
    selections = _.union(selections, dbModel.parseSelections(fragments, node.selectionSet && node.selectionSet.selections))
  })

  if (path) {
    path.split('.').forEach(p => {
      selections = _.flatten(selections.filter(s => s.name === p).map(t => t.selections || []))
    })
  }

  selections = [...selections, ..._.union(
    attributes || [],
    (order || []).filter(o => typeof o[0] === 'string').map(o => o[0])
  ).map(field => fieldToSelection(field))]

  const mainOrder = convertOrder({
    schema: sgContext.schemas[dbModel.name],
    order: order,
    sgContext: sgContext
  })

  const option = buildQueryOption({
    sgContext: sgContext,
    attributes: [],
    include: [...include],
    schema: sgContext.schemas[dbModel.name],
    selections: selections,
    orderPaths: [],
    eagerHasMany: mainOrder.filter(s => typeof s[0] !== 'string').length === 0
  })

  // console.log(require('util').inspect(option, {depth: 20}))
  return {
    include: option.include,
    attributes: option.attributes,
    order: _.unionBy(mainOrder, option.additionOrder, JSON.stringify)
  }
}
