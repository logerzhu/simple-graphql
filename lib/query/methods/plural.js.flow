// @flow
import * as _ from 'lodash'
import * as graphql from 'graphql'

import Model from '../../Model'
import Type from '../../type'
import SG from '../../index'
import StringHelper from '../../utils/StringHelper'

import type {QueryConfig} from '../../Context'

const SortEnumType = new graphql.GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASC: {value: 'ASC', description: '递增排序'},
    DESC: {value: 'DESC', description: '递减排序'}
  }
})

const DateConditionType = new graphql.GraphQLInputObjectType({
  name: 'DateCondition' + 'Input',
  fields: {
    gte: {
      type: Type.GraphQLScalarTypes.Date,
      description: '大于或等于'
    },
    lte: {
      type: Type.GraphQLScalarTypes.Date,
      description: '小于或等于'
    },
    gt: {
      type: Type.GraphQLScalarTypes.Date,
      description: '大于'
    },
    lt: {
      type: Type.GraphQLScalarTypes.Date,
      description: '小于'
    },
    ne: {
      type: Type.GraphQLScalarTypes.Date,
      description: '不等于'
    },
    eq: {
      type: Type.GraphQLScalarTypes.Date,
      description: '等于'
    }
  }
})

const NumberConditionType = new graphql.GraphQLInputObjectType({
  name: 'NumberCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLFloat,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLFloat,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLFloat,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLFloat,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLFloat,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLFloat,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '在里面'
    },
    notIn: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '不在里面'
    }
  }
})

const StringConditionType = new graphql.GraphQLInputObjectType({
  name: 'StringCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLString,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLString,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLString,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLString,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLString,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLString,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '在里面'
    },
    nin: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '不在里面'
    }
  }
})

export default function pluralQuery (model:Model):QueryConfig {
  const name = StringHelper.toInitialLowerCase(model.name) + 's'

  const searchFields = {}
  const conditionFieldKeys = []
  // 过滤不可搜索的field
  _.forOwn(model.config.fields, (value, key) => {
    if (!value['$type'] || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve'])) {
      if (value['required']) {
        searchFields[key] = Object.assign({}, value, {required: false})
      } else {
        searchFields[key] = value
      }
      if (value['default'] != null) {
        searchFields[key] = Object.assign({}, searchFields[key], {default: null})
      }
      if (value['advancedSearchable']) {
        if (value['$type'] === Date) {
          conditionFieldKeys.push(key)
          searchFields[key] = Object.assign({}, searchFields[key], {$type: DateConditionType})
        } else if (value['$type'] === Number) {
          conditionFieldKeys.push(key)
          searchFields[key] = Object.assign({}, searchFields[key], {$type: NumberConditionType})
        } else if (value['$type'] === String) {
          conditionFieldKeys.push(key)
          searchFields[key] = Object.assign({}, searchFields[key], {$type: StringConditionType})
        }
      }
    }
  }
  )

  // 生产
  return {
    name: name,
    $type: SG.Connection.connectionType(SG.modelRef(model.name)),
    args: {
      condition: {
        $type: _.mapValues(searchFields, (value) => {
          let type = value
          while (type['$type'] || _.isArray(type)) {
            if (type['$type']) {
              type = type['$type']
            } else if (_.isArray(type)) {
              type = type[0]
            }
          }
          if (value['$type']) {
            type = Object.assign({}, value, {$type: type, required: false})
          }
          if (type === Date || type['$type'] === Date) {
            type = DateConditionType
          }
          return type
        }),
        description: 'Query Condition'
      },
      sort: {
        $type: [{field: String, order: SortEnumType}],
        description: 'Define the sort field'
      },
      ...SG.Connection.args
    },
    resolve: async function (args:{[argName: string]: any},
                             context:any,
                             info:graphql.GraphQLResolveInfo,
                             models:any) {
      conditionFieldKeys.forEach(fieldKey => {
        if (args['condition'] && args['condition'][fieldKey]) {
          args['condition'][fieldKey] = _.mapKeys(args['condition'][fieldKey], function (value, key) {
            return '$' + key
          })
        }
      })

      return SG.Connection.resolve(models[model.name], args)
    }
  }
}
