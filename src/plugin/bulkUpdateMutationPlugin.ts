import _ from 'lodash'
import Sequelize from 'sequelize'
import StringHelper from '../utils/StringHelper'
import { PluginOptions } from '../Definition'

const isModelType = (fieldOptions, schemas) => {
  if (typeof fieldOptions === 'string') {
    return schemas.find((s) => s.name === fieldOptions) != null
  } else if (typeof fieldOptions === 'object') {
    return schemas.find((s) => s.name === (fieldOptions as any).$type) != null
  }
  return false
}

const getSearchFields = (schema, schemas) => {
  const searchFields: any = {}

  const advanceType = (type) => {
    if (
      typeof type === 'string' &&
      type.startsWith('[') &&
      type.endsWith(']')
    ) {
      return { contains: [type.substring(1, type.length - 2)] }
    }
    if (_.isArray(type)) {
      return { contains: type, strLike: 'String' }
    }
    const aType: any = {
      ne: type,
      eq: type,
      in: [type],
      notIn: [type]
    }
    if (
      type === 'Number' ||
      type === 'Integer' ||
      type === 'Date' ||
      type === 'DateTime'
    ) {
      aType.gt = type
      aType.gte = type
      aType.lt = type
      aType.lte = type
      aType.between = type
      aType.notBetween = type
    }
    if (type === 'String' || type === 'ShortText' || type === 'Text') {
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

  _.forOwn(
    { id: schema.name + 'Id', ...schema.config.fields },
    (value, key: string) => {
      if (isModelType(value, schemas)) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }
      if (value && value.$type) {
        if (!value.hidden && !value.resolve) {
          searchFields[key] = {
            ...value,
            $type: advanceType(value.$type),
            required: false,
            default: null
          }
        } else {
          return
        }
      } else {
        searchFields[key] = { $type: advanceType(value) }
      }

      searchFields[key].mapper = function (
        option: { where: Object },
        argValue,
        sgContext
      ) {
        if (argValue !== undefined) {
          option.where[Sequelize.Op.and] = option.where[Sequelize.Op.and] || []
          if (argValue == null) {
            option.where[Sequelize.Op.and].push({ [key]: argValue })
          } else {
            const keyCondition = {}
            for (const opKey of _.keys(argValue)) {
              if (opKey === 'strLike') {
                keyCondition[Sequelize.Op.like] = sgContext.sequelize.literal(
                  `"${argValue[opKey]}"`
                )
              } else if (opKey !== 'contains') {
                if (opKey === 'ne' && argValue[opKey] != null) {
                  keyCondition[Sequelize.Op.or] = [
                    { [Sequelize.Op.ne]: argValue[opKey] },
                    { [Sequelize.Op.eq]: null }
                  ]
                } else if (
                  opKey === 'in' &&
                  argValue[opKey] != null &&
                  argValue[opKey].indexOf(null) !== -1
                ) {
                  keyCondition[Sequelize.Op.or] = [
                    {
                      [Sequelize.Op.in]: argValue[opKey].filter(
                        (a) => a != null
                      )
                    },
                    { [Sequelize.Op.eq]: null }
                  ]
                } else if (
                  opKey === 'notIn' &&
                  argValue[opKey] != null &&
                  argValue[opKey].indexOf(null) === -1
                ) {
                  keyCondition[Sequelize.Op.or] = [
                    {
                      [Sequelize.Op.notIn]: argValue[opKey].filter(
                        (a) => a != null
                      )
                    },
                    { [Sequelize.Op.eq]: null }
                  ]
                } else {
                  keyCondition[Sequelize.Op[opKey]] = argValue[opKey]
                }
              } else {
                option.where[Sequelize.Op.and].push(
                  sgContext.sequelize.literal(
                    `json_contains(\`${key}\`, '${JSON.stringify(
                      argValue[opKey]
                    )}' )`
                  )
                )
              }
            }
            option.where[Sequelize.Op.and].push({ [key]: keyCondition })
          }
        }
      }
    }
  )
  return searchFields
}

const getValueFields = (schema, schemas) => {
  const valueFields = {}
  _.forOwn(schema.config.fields, (value, key) => {
    if (isModelType(value, schemas)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (value && value.$type) {
      if (!value.hidden && (!value.config || value.config.mutable !== false)) {
        valueFields[key] = { ...value, required: false, default: null }
      }
    } else {
      valueFields[key] = value
    }
  })
  return valueFields
}

export default {
  name: 'bulkUpdateMutation',
  defaultOptions: false,
  priority: 0,
  description: 'Gen `bulk update mutation` for Schema',
  applyToSchema: function (schema, options, schemas): void {
    const name = 'bulkUpdate' + StringHelper.toInitialUpperCase(schema.name)
    const changedName = 'changed' + StringHelper.toInitialUpperCase(schema.name)

    let config: { [key: string]: any } = {}
    if (typeof options === 'object') {
      config = options
    }

    const searchFields = {
      ...getSearchFields(schema, schemas),
      ...((options && (<{ [key: string]: any }>options).conditionFields) || {})
    }
    const valueFields = getValueFields(schema, schemas)

    if (_.keys(searchFields).length === 0 || _.keys(valueFields).length === 0) {
      return
    }

    const inputFields: any = {
      condition: {
        $type: [
          [
            _.mapValues(searchFields, (fieldConfig) => {
              const { mapper, ...value } = fieldConfig
              return value
            })
          ]
        ],
        required: true,
        description: 'Update Condition'
      },
      values: {
        $type: valueFields,
        required: true,
        description: 'Update Values'
      }
    }

    schema.mutations({
      [config.name || name]: {
        config: config,
        inputFields: inputFields,
        outputFields: {
          [changedName]: [schema.name]
        },
        mutateAndGetPayload: async function (args, context, info, sgContext) {
          const dbModel = sgContext.models[schema.name]

          const condition = args.condition || []

          const queryOption = { where: {} }

          if (condition && condition.length > 0) {
            const where = queryOption.where
            for (const c of condition) {
              const and = []
              for (const cc of c) {
                queryOption.where = {}
                for (const key of _.keys(searchFields)) {
                  await searchFields[key].mapper(
                    queryOption,
                    cc[key],
                    sgContext
                  )
                }
                if (queryOption.where[Sequelize.Op.and]) {
                  and.push(queryOption.where[Sequelize.Op.and])
                }
              }
              if (and.length > 0) {
                where[Sequelize.Op.or] = where[Sequelize.Op.or] || []
                where[Sequelize.Op.or].push({ [Sequelize.Op.and]: and })
              }
            }
            queryOption.where = where
          }

          const values = {}

          _.forOwn(schema.config.fields, (value, key) => {
            if (isModelType(value, schemas)) {
              if (!key.endsWith('Id')) {
                key = key + 'Id'
              }
              if (typeof args.values[key] !== 'undefined') {
                values[key] = args.values[key]
              }
            } else if (typeof args.values[key] !== 'undefined') {
              values[key] = args.values[key]
            }
          })
          const instances = await dbModel.findAll({ where: queryOption.where })
          const results = []
          const valueKeys = _.keys(values)
          const hasChange = (record, v) => {
            for (const key of valueKeys) {
              if (record[key] !== v[key]) {
                return true
              }
            }
            return false
          }
          for (const instance of instances) {
            if (hasChange(instance, values)) {
              results.push(await instance.update(values))
            }
          }
          return {
            [changedName]: results
          }
        }
      }
    })
  }
} as PluginOptions
