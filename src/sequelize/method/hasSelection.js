// @flow
import _ from 'lodash'

export default function (args:{
  info:Object,
  path:string}) {
  const dbModel = this

  const {info, path} = args

  const fragments = info.fragments || []

  let selections = [];

  (info.fieldNodes || []).forEach(node => {
    selections = _.union(selections, dbModel.parseSelections(fragments, node.selectionSet && node.selectionSet.selections))
  })

  path.split('.').forEach(p => {
    selections = _.flatten(selections.filter(s => s.name === p).map(t => t.selections || []))
  })

  return selections.length > 0
}
