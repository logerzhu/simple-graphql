// @flow
export default function (args:{include:Array<any>, info:Object, path?:string}) {
  const dbModel = this
  let {include = [], info, path} = args
  const fragments = info.fragments
  const selectionSet = info.fieldNodes[0].selectionSet
  const buildSelections = function (selections:Array<Object>) {
    const result = []
    if (selections) {
      selections.forEach(selection => {
        if (selection.kind === 'Field') {
          const selectionSet = selection.selectionSet
          return result.push({
            name: selection.name.value,
            selections: selectionSet && buildSelections(selectionSet.selections)
          })
        } else if (selection.kind === 'FragmentSpread') {
          const fragment = fragments[selection.name.value]
          buildSelections(fragment.selectionSet && fragment.selectionSet.selections).forEach(
            r => result.push(r)
          )
        }
      })
    }
    return result
  }

  const sgContext = this.getSGContext()
  const buildInclude = function (nInclude, nSchema, selections) {
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
            const subInclude = buildInclude(exit.include || [], sgContext.schemas[config.target], selection.selections)
            subInclude.forEach(sInclude => {
              if (exit.include.filter(i => i.as === sInclude.as).length === 0) {
                exit.include.push(sInclude)
              }
            })
          } else {
            nInclude.push({
              model: sgContext.models[config.target],
              as: selection.name,
              include: buildInclude([], sgContext.schemas[config.target], selection.selections),
              required: false
            })
          }
        }
      }
    }
    return nInclude
  }
  let selections = buildSelections(selectionSet && selectionSet.selections)
  if (path) {
    path.split('.').forEach(p => {
      selections = (selections.filter(s => s.name === p)[0] || {}).selections || []
    })
  }
  return buildInclude(include, sgContext.schemas[dbModel.name], selections)
}
