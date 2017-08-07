// @flow
import singularQueryPlugin from './singularQueryPlugin'
import pluralQueryPlugin from './pluralQueryPlugin'

import addMutationPlugin from './addMutationPlugin'
import deleteMutationPlugin from './deleteMutationPlugin'
import updateMutationPlugin from './updateMutationPlugin'

export default{
  singularQueryPlugin: singularQueryPlugin,
  pluralQueryPlugin: pluralQueryPlugin,

  addMutationPlugin: addMutationPlugin,
  deleteMutationPlugin: deleteMutationPlugin,
  updateMutationPlugin: updateMutationPlugin

}
