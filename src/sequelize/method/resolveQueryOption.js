// @flow
import _ from 'lodash'
export default function (args:{attributes:Array<string>, include:Array<any>, info:Object, path?:string}) {
  const dbModel = this
  const {include = [], attributes = [], info, path} = args
  const fragments = info.fragments || []

  const sgContext = this.getSGContext()

  const buildQueryOption = function (nAttributes, nInclude, nSchema, selections) {
    const parseAttributesOption = sgContext.models[nSchema.name].parseAttributes({
      attributes: nAttributes,
      selections: selections
    })
    selections = [...(selections || []), ...parseAttributesOption.additionSelections]

    if (selections) {
      for (let selection of selections) {
        let config = nSchema.config.associations.belongsTo[selection.name] || nSchema.config.associations.hasOne[selection.name]
        if (!config) {
          const hasManyConfig = nSchema.config.associations.hasMany[selection.name]
          if (hasManyConfig && hasManyConfig.outputStructure === 'Array' &&
            (hasManyConfig.conditionFields == null || hasManyConfig.conditionFields.length === 0)) {
            config = hasManyConfig
          }
        }
        if (config) {
          const exit = nInclude.filter(i => i.as === selection.name)[0]
          if (exit) {
            const option = buildQueryOption(exit.attributes || [], exit.include || [], sgContext.schemas[config.target], selection.selections)
            exit.include = option.include
            exit.attributes = option.attributes
          } else {
            const option = buildQueryOption([], [], sgContext.schemas[config.target], selection.selections)
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

  let selections = []
  info.fieldNodes.forEach(node => {
    selections = _.union(selections, dbModel.parseSelections(fragments, node.selectionSet && node.selectionSet.selections))
  })
  if (path) {
    path.split('.').forEach(p => {
      selections = (selections.filter(s => s.name === p)[0] || {}).selections || []
    })
  }
  return buildQueryOption(attributes, [...include], sgContext.schemas[dbModel.name], selections)
}
