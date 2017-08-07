/// / @flow
// import * as _ from 'lodash'
//
// import Model from '../../schema/Schema'
// import SchemaRef from '../../schema/SchemaRef'
// import StringHelper from '../../utils/StringHelper'
//
// import type {LinkedFieldConfig} from '../../Definition'
//
// export default function hasOneFieldsConfig (model:Model):{[string]:LinkedFieldConfig} {
//  const config = ({}:{[string]:LinkedFieldConfig})
//  // Conver model association to field config
//  for (let hasOneCfg of model.config.associations.hasOne) {
//    if (hasOneCfg.hidden) {
//      continue
//    }
//    const fieldName = _.get(hasOneCfg, 'options.as', hasOneCfg.target)
//    config[fieldName] = {
//      $type: new SchemaRef(hasOneCfg.target),
//      resolve: async function (root, args, context, info, models) {
//        if (root[fieldName] != null) {
//          return root[fieldName]
//        } else {
//          return root['get' + StringHelper.toInitialUpperCase(fieldName)]()
//        }
//      }
//    }
//  }
//  return config
// }
