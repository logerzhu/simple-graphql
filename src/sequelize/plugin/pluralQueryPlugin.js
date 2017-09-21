// @flow
import * as _ from 'lodash'
import * as graphql from 'graphql'
import Sequelize from 'sequelize'

import Schema from '../../definition/Schema'
import Type from '../../type'
import StringHelper from '../../utils/StringHelper'
import resolveConnection from '../resolveConnection'

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

export default function pluralQuery (schema:Schema<any>, options:any):void {
  const name = StringHelper.toInitialLowerCase(schema.name) + 's'

  const searchFields = {}
  const conditionFieldKeys = []
  // 过滤不可搜索的field
  _.forOwn(schema.config.fields, (value, key) => {
    if (typeof value === 'string' || (value && typeof value.$type === 'string')) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
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

  if (options && options.conditionArgs) {
    Object.assign(searchFields, (options.conditionArgs:any))
  }

  let config = {}
  if ((typeof options) === 'object') {
    config = options
  }

  // 生产
  schema.queries({
    [name]: {
      config: config,
      $type: schema.name + 'Connection',
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
        keywords: {
          fields: {
            $type: [String],
            required: true
          },
          value: {
            $type: String,
            required: true
          }
        }
      },
      resolve: async function (args:{[argName: string]: any},
                               context:any,
                               info:graphql.GraphQLResolveInfo,
                               models:any) {
        const dbModel = models[schema.name]

        let {sort = [{field: 'id', order: 'ASC'}], condition = {}} = (args != null ? args : {})

        if (dbModel.options.underscored) {
          for (let item of sort) {
            item.field = StringHelper.toUnderscoredName(item.field)
          }
        }

        conditionFieldKeys.forEach(fieldKey => {
          if (condition[fieldKey]) {
            condition[fieldKey] = _.mapKeys(condition[fieldKey], function (value, key) {
              return '$' + key
            })
          }
        })

        const include = []
        const includeFields = {}

        const associationType = (model, fieldName):?string => {
          if (model.config.associations.hasOne[fieldName]) {
            return model.config.associations.hasOne[fieldName].target
          }
          if (model.config.associations.belongsTo[fieldName]) {
            return model.config.associations.belongsTo[fieldName].target
          }
          return null
        }

        _.forOwn(schema.config.fields, (value, key) => {
          if (typeof value === 'string' || (value && typeof value.$type === 'string')) {
            if (typeof condition[key] !== 'undefined') {
              if (!includeFields[key]) {
                const type = associationType(schema, key)
                includeFields[key] = true
                include.push({
                  model: dbModel.sequelize.models[type],
                  as: key,
                  required: true
                })
              }
              if (!condition.$and) {
                condition.$and = []
              }
              Object.keys(condition[key]).forEach(f => {
                if (dbModel.options.underscored) {
                  condition.$and.push(Sequelize.where(Sequelize.col(key + '.' + StringHelper.toUnderscoredName(f)), {$eq: condition[key][f]}))
                } else {
                  condition.$and.push(Sequelize.where(Sequelize.col(key + '.' + f), {$eq: condition[key][f]}))
                }
              })
              delete condition[key]
            }

            if (!key.endsWith('Id')) {
              key = key + 'Id'
            }
            if (typeof condition[key] !== 'undefined') {
              if (dbModel.options.underscored) {
                const underscoredKey = StringHelper.toUnderscoredName(key)
                if (underscoredKey !== key) {
                  condition[underscoredKey] = condition[key]
                  delete condition[key]
                }
              }
            }
          }
        })

        if (args && args.keywords) {
          const {fields, value} = args.keywords
          const keywordsCondition = []

          for (let field of fields) {
            if (field.indexOf('.') !== -1) {
              const fieldName = field.split('.')[0]
              const type = associationType(schema, fieldName)
              if (type) {
                if (!includeFields[fieldName]) {
                  includeFields[fieldName] = true
                  include.push({
                    model: dbModel.sequelize.models[type],
                    as: fieldName,
                    required: false
                  })
                }
                let colFieldName = field
                if (dbModel.options.underscored) {
                  colFieldName = fieldName + StringHelper.toUnderscoredName(field.substr(field.indexOf('.')))
                }
                keywordsCondition.push(Sequelize.where(Sequelize.col(colFieldName), {$like: '%' + value + '%'}))
              } else {
                keywordsCondition.push({[field]: {$like: '%' + value + '%'}})
              }
            } else {
              keywordsCondition.push({[field]: {$like: '%' + value + '%'}})
            }
          }
          condition.$or = keywordsCondition
        }
        return resolveConnection(dbModel, {...args, condition, include})
      }
    }
  })
}
