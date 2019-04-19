// @flow
export default function parseSelections (fragments:Array<any>, selections:Array<Object>) {
  const result = []
  if (selections) {
    selections.forEach(selection => {
      if (selection.kind === 'Field') {
        const selectionSet = selection.selectionSet
        return result.push({
          name: selection.name.value,
          selections: selectionSet && parseSelections(fragments, selectionSet.selections)
        })
      } else if (selection.kind === 'FragmentSpread') {
        const fragment = fragments[selection.name.value]
        parseSelections(fragments, fragment.selectionSet && fragment.selectionSet.selections).forEach(
          r => result.push(r)
        )
      }
    })
  }
  return result
}
