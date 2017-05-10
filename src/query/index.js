// @flow
import singularQuery from './methods/singular'
import pluralQuery from './methods/plural'

import hasManyQueryFields from './fields/hasMany'
import hasOneQueryFields from './fields/hasOne'

export default {
  singularQuery: singularQuery,
  pluralQuery: pluralQuery,

  hasManyQueryFields: hasManyQueryFields,
  hasOneQueryFields: hasOneQueryFields
}
