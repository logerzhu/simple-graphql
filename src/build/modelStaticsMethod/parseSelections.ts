export default function parseSelections(fragments: Array<any>, selections: Array<Object>, base?: { namedType: string; }) {
    const result = [];
    if (selections) {
        selections.forEach(selection => {
            if (selection.kind === 'Field') {
                const selectionSet = selection.selectionSet;
                result.push({
                    ...(base || {}),
                    name: selection.name.value,
                    selections: selectionSet && parseSelections(fragments, selectionSet.selections)
                });
            } else if (selection.kind === 'FragmentSpread') {
                const fragment = fragments[selection.name.value];
                parseSelections(fragments, fragment.selectionSet && fragment.selectionSet.selections).forEach(r => result.push(r));
            } else if (selection.kind === 'InlineFragment') {
                if (selection.typeCondition && selection.typeCondition.kind === 'NamedType') {
                    const namedType = selection.typeCondition.name.value;
                    parseSelections(fragments, selection.selectionSet && selection.selectionSet.selections, {namedType: namedType}).forEach(r => result.push(r));
                }
            }
        });
    }
    return result;
}