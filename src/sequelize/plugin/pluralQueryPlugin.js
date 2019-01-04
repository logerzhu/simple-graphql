// @flow
import _ from 'lodash'
import * as graphql from 'graphql'
import Sequelize from 'sequelize'

import Schema from '../../definition/Schema'
import Type from '../../type'
import StringHelper from '../../utils/StringHelper'

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

const getSearchFields = (schema) => {
  const searchFields:any = []
  _.forOwn(schema.config.fields, (value, key) => {
    if (typeof value === 'string' || (value && typeof value.$type === 'string')) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (!searchFields[key] && (!value['$type'] || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve']))) {
      if (!value['$type']) {
        searchFields[key] = {$type: value}
      } else {
        if (value['required']) {
          searchFields[key] = {...value, required: false}
        } else {
          searchFields[key] = value
        }
        if (value['default'] != null) {
          searchFields[key] = {...searchFields[key], default: null}
        }
      }

      let type = searchFields[key]
      while (type['$type'] || _.isArray(type)) {
        if (type['$type']) {
          type = type['$type']
        } else if (_.isArray(type)) {
          type = type[0]
        }
      }
      if (type === Date || type['$type'] === Date) {
        type = DateConditionType
      }
      if (searchFields[key]['$type']) {
        searchFields[key] = {...searchFields[key], ...{$type: type}}
      } else {
        searchFields[key] = {$type: type}
      }

      searchFields[key].mapper = function (option:{where:Object, additionFields:Array<string>}, argValue) {
        if (argValue !== undefined) {
          option.where.$and = option.where.$and || []
          option.where.$and.push({[key]: argValue})
        }
      }
    }
  })
  return searchFields
}

export default function pluralQuery (schema:Schema<any>, options:any):void {
  const name = StringHelper.toInitialLowerCase(schema.name) + 's'

  const searchFields = {...getSearchFields(schema), ...((options && options.conditionFields) || {})}

  // 过滤不可搜索的field
  let config = {}
  if ((typeof options) === 'object') {
    config = options
  }

  const keywordField = {
    $type: {
      fields: {
        $type: [String],
        required: true
      },
      value: {
        $type: String,
        required: true
      }
    },
    mapper: function (option:{where:Object, bind:Array<any>, additionFields:Array<string>}, argValue, sgContext) {
      if (argValue != null) {
        const {fields, value} = argValue
        option.additionFields = _.union((option.additionFields || []), fields)
        option.where.$and = option.where.$and || []
        option.where.$and.push({
          $or: fields.map(field => {
            let ss = field.split('.')
            if (sgContext.models[schema.name].options.underscored) {
              ss[ss.length - 1] = StringHelper.toUnderscoredName(ss[ss.length - 1])
            }
            if (ss.length > 2) {
              field = ss.slice(0, ss.length - 1).join(('->')) + '.' + ss[ss.length - 1]
            } else {
              field = ss.join('.')
            }
            return Sequelize.where(Sequelize.col(field), {$like: '%' + value + '%'})
          })
        })
      }
    }
  }

  // 生产
  schema.queries({
    [config.name || name]: {
      config: config,
      $type: schema.name + 'Connection',
      args: {
        condition: {
          $type: _.mapValues(searchFields, (fieldConfig) => {
            const {mapper, ...value} = fieldConfig
            return value
          }),
          description: 'Query Condition'
        },
        sort: {
          $type: [{field: String, order: SortEnumType}],
          description: 'Define the sort field'
        },
        keywords: keywordField.$type
      },
      resolve: async function (args:{[argName: string]: any},
                               context:any,
                               info:graphql.GraphQLResolveInfo,
                               sgContext) {
        const dbModel = sgContext.models[schema.name]

        let {sort = [{field: 'id', order: 'ASC'}], condition = {}, keywords} = (args || {})

        let queryOption = {where: {}, bind: [], additionFields: []}
        if (keywords) {
          await keywordField.mapper(queryOption, keywords, sgContext)
        }

        if (condition) {
          _.forOwn(searchFields, async (value, key) => {
            await value.mapper(queryOption, condition[key], sgContext)
          })
        }

        const option = dbModel.resolveQueryOption({
          info: info,
          path: 'edges.node',
          additionFields: queryOption.additionFields.map(f => 'edges.node.' + f),
          order: sort.map(s => [s.field, s.order])
        })

        return dbModel.resolveRelayConnection({
          ...args,
          where: queryOption.where,
          bind: queryOption.bind,
          include: option.include,
          attributes: option.attributes,
          order: option.order
        })
      }
    }
  })
}
