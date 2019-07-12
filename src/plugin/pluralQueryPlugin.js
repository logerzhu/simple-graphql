// @flow
import _ from 'lodash'
import Sequelize from 'sequelize'
import StringHelper from '../utils/StringHelper'
import type { ColumnFieldOptions, PluginOptions } from '../Definition'

const getSearchFields = (schema, schemas) => {
  const searchFields: any = {}

  const isModelType = (fieldOptions: ColumnFieldOptions) => {
    if (typeof fieldOptions === 'string') {
      return schemas.find(s => s.name === fieldOptions) != null
    } else if (typeof fieldOptions === 'object') {
      return schemas.find(s => s.name === (fieldOptions: any).$type) != null
    }
    return false
  }

  const advanceType = (type) => {
    if (typeof type === 'string' && type.startsWith('[') && type.endsWith(']')) {
      return { contains: [type] }
    }
    if (type === 'Boolean') {
      return type
    }
    const aType: any = {
      ne: type,
      eq: type,
      in: [type],
      notIn: [type]
    }
    if (type === 'Number' || type === 'Integer' || type === 'Date') {
      aType.gt = type
      aType.gte = type
      aType.lt = type
      aType.lte = type
      aType.between = type
      aType.notBetween = type
    }
    if (type === 'String') {
      aType.like = type
      aType.notLike = type
      aType.startsWith = type
      aType.endsWith = type
      aType.substring = type
      aType.regexp = type
      aType.notRegexp = type
    }
    return aType
  }

  _.forOwn({ id: schema.name + 'Id', ...schema.config.fields }, (value, key: string) => {
    if (isModelType(value)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (value && value.$type) {
      if (!value.hidden && !value.resolve) {
        searchFields[key] = { ...value, $type: advanceType(value.$type), required: false, default: null }
      } else {
        return
      }
    } else {
      searchFields[key] = { $type: advanceType(value) }
    }

    searchFields[key].mapper = function (option: { where: Object, attributes: Array<string> }, argValue, sgContext) {
      if (argValue !== undefined) {
        option.where.$and = option.where.$and || []
        if (argValue == null || typeof argValue === 'boolean') {
          option.where.$and.push({ [key]: argValue })
        } else {
          const keyCondition = {}
          for (let opKey of _.keys(argValue)) {
            if (opKey !== 'contains') {
              keyCondition[Sequelize.Op[opKey]] = argValue[opKey]
            } else {
              option.where.$and.push(Sequelize.literal(`json_contains(\`${key}\`, '${JSON.stringify(argValue[opKey])}' )`))
            }
          }
          option.where.$and.push({ [key]: keyCondition })
        }
      }
    }
  })
  return searchFields
}

export default ({
  name: 'pluralQuery',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `plural query` for Schema',
  apply: function pluralQuery (schema, options, schemas): void {
    const searchFields = { ...getSearchFields(schema, schemas), ...((options && options.conditionFields) || {}) }

    let config = {}
    if ((typeof options) === 'object') {
      config = options
    }

    schema.queries({
      [`${StringHelper.toInitialLowerCase(config.name || schema.name + 's')}`]: {
        config: config,
        $type: schema.name + 'Connection',
        args: {
          ...(_.keys(searchFields).length > 0 ? {
            condition: {
              $type: [_.mapValues(searchFields, (fieldConfig) => {
                const { mapper, ...value } = fieldConfig
                return value
              })],
              description: 'Query Condition'
            }
          } : {}),
          sort: {
            $type: [{ field: new Set(_.keys(searchFields)), order: new Set(['ASC', 'DESC']) }],
            description: 'Define the sort field'
          }
        },
        resolve: async function (args, context, info, sgContext) {
          const dbModel = sgContext.models[schema.name]

          let { sort = [{ field: 'id', order: 'ASC' }], condition = [] } = (args || {})

          let queryOption = { where: {}, bind: [], attributes: [] }

          if (condition && condition.length > 0) {
            const where = queryOption.where
            for (let c of condition) {
              queryOption.where = {}
              for (let key of _.keys(searchFields)) {
                await searchFields[key].mapper(queryOption, c[key], sgContext)
              }
              if (queryOption.where.$and) {
                where.$or = where.$or || []
                where.$or.push(queryOption.where.$and)
              }
            }
            queryOption.where = where
          }

          return dbModel.resolveRelayConnection({
            pagination: args,
            selectionInfo: info,
            where: queryOption.where,
            bind: queryOption.bind,
            attributes: queryOption.attributes,
            order: sort.map(s => [s.field, s.order])
          })
        }
      }
    })
  }
}: PluginOptions)
