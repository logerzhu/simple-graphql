import _ from 'lodash'
import { GraphQLResolveInfo } from 'graphql'
import { SGModelCtrl } from '../../Definition'

export default function (
  this: SGModelCtrl,
  args: { info: GraphQLResolveInfo; path: string }
) {
  const dbModel = this

  const { info, path } = args

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

  path.split('.').forEach((p) => {
    selections = _.flatten(
      selections.filter((s) => s.name === p).map((t) => t.selections || [])
    )
  })

  return selections.length > 0
}
