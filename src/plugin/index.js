// @flow

import addMutationPlugin from './addMutationPlugin'
import deleteMutationPlugin from './deleteMutationPlugin'
import genHasManyLinkPlugin from './genHasManyLinkPlugin'
import genHasOneLinkPlugin from './genHasOneLinkPlugin'
import pluralQueryPlugin from './pluralQueryPlugin'
import singularQueryPlugin from './singularQueryPlugin'
import timestampPlugin from './timestampPlugin'
import updateMutationPlugin from './updateMutationPlugin'

export default [
  addMutationPlugin,
  deleteMutationPlugin,
  genHasManyLinkPlugin,
  genHasOneLinkPlugin,
  pluralQueryPlugin,
  singularQueryPlugin,
  timestampPlugin,
  updateMutationPlugin
]
