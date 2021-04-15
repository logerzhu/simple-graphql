import _ from 'lodash'
import { GraphQLResolveInfo } from 'graphql'
import { SGModel, SGModelCtrl } from '../../index'
import { Selection } from './parseSelections'

export default function <M extends SGModel>(
  this: SGModelCtrl<M>,
  args: { info?: GraphQLResolveInfo; path: string }
): boolean {
  const dbModel = this

  const { info, path } = args

  if (!info) {
    return false
  }

  const fragments = info.fragments || {}

  let selections: Array<Selection> = []

  ;(info.fieldNodes || []).forEach((node) => {
    selections = _.union(
      selections,
      dbModel.parseSelections(fragments, node.selectionSet?.selections)
    )
  })

  path.split('.').forEach((p) => {
    selections = _.flatten(
      selections.filter((s) => s.name === p).map((t) => t.selections || [])
    )
  })

  return selections.length > 0
}
