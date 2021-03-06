import { FragmentDefinitionNode, SelectionNode } from 'graphql'
import { SGModel, SGModelCtrl } from '../../index'

export type Selection = {
  namedType?: string
  name: string
  selections?: Array<Selection>
}

export default function parseSelections(
  fragments: { [key: string]: FragmentDefinitionNode },
  selections?: ReadonlyArray<SelectionNode>,
  base?: { namedType: string }
) {
  const result: Array<Selection> = []
  if (selections) {
    selections.forEach((selection) => {
      if (selection.kind === 'Field') {
        const selectionSet = selection.selectionSet
        result.push({
          ...(base || {}),
          name: selection.name.value,
          selections:
            selectionSet && parseSelections(fragments, selectionSet.selections)
        })
      } else if (selection.kind === 'FragmentSpread') {
        const fragment = fragments[selection.name.value]
        parseSelections(
          fragments,
          fragment.selectionSet && fragment.selectionSet.selections
        ).forEach((r) => result.push(r))
      } else if (selection.kind === 'InlineFragment') {
        if (
          selection.typeCondition &&
          selection.typeCondition.kind === 'NamedType'
        ) {
          const namedType = selection.typeCondition.name.value
          parseSelections(
            fragments,
            selection.selectionSet && selection.selectionSet.selections,
            { namedType: namedType }
          ).forEach((r) => result.push(r))
        }
      }
    })
  }
  return result
}
