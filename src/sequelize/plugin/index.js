// @flow
import singularQueryPlugin from './singularQueryPlugin'
import pluralQueryPlugin from './pluralQueryPlugin'

import addMutationPlugin from './addMutationPlugin'
import deleteMutationPlugin from './deleteMutationPlugin'
import updateMutationPlugin from './updateMutationPlugin'

import hasManyLinkedFieldPlugin from './hasManyLinkedFieldPlugin'
import hasOneLinkedFieldPlugin from './hasOneLinkedFieldPlugin'

export default{
  singularQueryPlugin: singularQueryPlugin,
  pluralQueryPlugin: pluralQueryPlugin,

  addMutationPlugin: addMutationPlugin,
  deleteMutationPlugin: deleteMutationPlugin,
  updateMutationPlugin: updateMutationPlugin,

  hasManyLinkedFieldPlugin: hasManyLinkedFieldPlugin,
  hasOneLinkedFieldPlugin: hasOneLinkedFieldPlugin

}
