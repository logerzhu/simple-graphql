// @flow
import singularQuery from './methods/singular'
import pluralQuery from './methods/plural'

import hasManyQueryFields from './fields/hasMany'

export default {
  singularQuery: singularQuery,
  pluralQuery: pluralQuery,

  hasManyQueryFields: hasManyQueryFields
}
