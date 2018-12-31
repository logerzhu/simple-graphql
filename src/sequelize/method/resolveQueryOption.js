// @flow
import _ from 'lodash'

export default function (args:{
  attributes?:Array<string>,
  include?:Array<any>,
  order?: Array<Array<any>>,
  info:Object,
  path?:string,
  additionFields?:Array<string>}) {
  const dbModel = this
  const {include = [], attributes = [], order = [], info, path, additionFields} = args
  const fragments = info.fragments || []

  const sgContext = this.getSGContext()

  const fieldToSelection = (field) => {
    const index = field.indexOf('.')
    if (index === -1) { return {name: field} } else {
      return {
        name: field.substr(0, index),
        selections: [fieldToSelection(field.substr(index + 1))]
      }
    }
  }

  const buildQueryOption = function (nAttributes, nInclude, nSchema, selections, orderPaths) {
    const parseAttributesOption = sgContext.models[nSchema.name].parseAttributes({
      attributes: nAttributes,
      selections: selections
    })
    selections = [...(selections || []), ...parseAttributesOption.additionSelections]

    if (selections) {
      for (let selection of selections) {
        let config = nSchema.config.associations.belongsTo[selection.name] || nSchema.config.associations.hasOne[selection.name]
        const hasManyConfig = nSchema.config.associations.hasMany[selection.name]

        if (!config) {
          if (hasManyConfig && hasManyConfig.outputStructure === 'Array' &&
            (hasManyConfig.conditionFields == null || hasManyConfig.conditionFields.length === 0)) {
            config = hasManyConfig

            // add hasManyConfig order config
            const configOrder = (config.order || [['id', 'ASC']])
            configOrder.forEach(p => {
              order.push([...orderPaths, {model: sgContext.models[config.target], as: selection.name}, ...p])
            })
          }
        }
        if (config) {
          const exit = nInclude.filter(i => i.as === selection.name)[0]
          if (exit) {
            const option = buildQueryOption(exit.attributes || [], exit.include || [], sgContext.schemas[config.target], selection.selections, [...orderPaths, {
              model: sgContext.models[config.target],
              as: selection.name
            }])
            exit.include = option.include
            exit.attributes = option.attributes
          } else {
            const option = buildQueryOption([], [], sgContext.schemas[config.target], selection.selections, [...orderPaths, {
              model: sgContext.models[config.target],
              as: selection.name
            }])
            nInclude.push({
              model: sgContext.models[config.target],
              as: selection.name,
              include: option.include,
              attributes: option.attributes,
              required: false
            })
          }
        }
      }
    }
    return {
      include: nInclude,
      attributes: parseAttributesOption.attributes
    }
  }

  let selections = additionFields ? additionFields.map(field => fieldToSelection(field)) : []
  info.fieldNodes.forEach(node => {
    selections = _.union(selections, dbModel.parseSelections(fragments, node.selectionSet && node.selectionSet.selections))
  })

  if (path) {
    path.split('.').forEach(p => {
      selections = _.flatten(selections.filter(s => s.name === p).map(t => t.selections || []))
    })
  }

  return {...buildQueryOption(attributes, [...include], sgContext.schemas[dbModel.name], selections, []), order: order}
}
