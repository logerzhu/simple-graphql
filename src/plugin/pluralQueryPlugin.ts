import _ from 'lodash'
import Sequelize from 'sequelize'
import StringHelper from '../utils/StringHelper'
import {
  SGColumnFieldConfig,
  SGConditionFieldMapper,
  SGHookOptionsMap,
  SGInputFieldConfig,
  SGInputFieldConfigMap,
  SGPluginConfig,
  SGPluginOptions
} from '..'
import {SGSchema} from "../definition/SGSchema";

const getSearchFields = (
  additionFields: SGInputFieldConfigMap,
  schema: SGSchema,
  schemas: Array<SGSchema>
) => {
  const isModelType = (fieldOptions: SGInputFieldConfig) => {
    return (
      fieldOptions.type &&
      schemas.find((s) => s.name === fieldOptions.type) != null
    )
  }

  const advanceType = (options: SGInputFieldConfig): SGInputFieldConfig => {
    if (options.elements) {
      return {
        properties: {
          contains: options.elements
        }
      }
    } else if (options.type === 'Boolean') {
      return options
    }

    const aType: SGInputFieldConfigMap = {
      ne: options,
      eq: options,
      in: {
        elements: options
      },
      notIn: {
        elements: options
      }
    }
    if (
      options.type === 'Number' ||
      options.type === 'Integer' ||
      options.type === 'Date'
    ) {
      aType.gt = options
      aType.gte = options
      aType.lt = options
      aType.lte = options
      aType.between = options
      aType.notBetween = options
    }
    if (options.type === 'String') {
      aType.like = options
      aType.notLike = options
      aType.startsWith = options
      aType.endsWith = options
      aType.substring = options
      aType.regexp = options
      aType.notRegexp = options
    }
    return {
      properties: aType
    }
  }

  const searchFields: {
    [key: string]: {
      definition: SGInputFieldConfig
      mapper: SGConditionFieldMapper
    }
  } = {}
  _.forOwn(
    {
      id: {type: schema.name + 'Id'} as SGColumnFieldConfig,
      ...schema.config.fields,
      ...additionFields
    },
    (value, key: string) => {
      if (isModelType(value)) {
        if (!key.endsWith('Id')) {
          key = key + 'Id'
        }
      }
      if (
        value.metadata?.graphql?.hidden !== true &&
        value.metadata?.graphql?.searchable !== false
      ) {
        if (value.metadata?.graphql?.mapper) {
          //自定义mapper不需要扩展查询类型
          searchFields[key] = {
            definition: {
              ...value,
              nullable: true,
              metadata: {description: value.metadata?.description}
            },
            mapper: value.metadata?.graphql?.mapper
          }
        } else {
          searchFields[key] = {
            definition: advanceType({
              ...value,
              nullable: true,
              metadata: {description: value.metadata?.description}
            }),
            mapper: function (
              option: { where: Object; attributes: Array<string> },
              argValue,
              sgContext
            ) {
              if (argValue !== undefined) {
                option.where[Sequelize.Op.and] =
                  option.where[Sequelize.Op.and] || []
                if (argValue == null || typeof argValue === 'boolean') {
                  option.where[Sequelize.Op.and].push({[key]: argValue})
                } else {
                  const keyCondition = {}
                  for (const opKey of _.keys(argValue)) {
                    if (opKey !== 'contains') {
                      keyCondition[Sequelize.Op[opKey]] = argValue[opKey]
                    } else {
                      option.where[Sequelize.Op.and].push(
                        Sequelize.literal(
                          `json_contains(\`${key}\`, '${JSON.stringify(
                            argValue[opKey]
                          )}' )`
                        )
                      )
                    }
                  }
                  option.where[Sequelize.Op.and].push({[key]: keyCondition})
                }
              }
            }
          }
        }
      }
    }
  )
  return searchFields
}

type PluralQueryOptions = SGPluginOptions & {
  name?: string
  conditionFields?: SGInputFieldConfigMap
  hookOptions?: SGHookOptionsMap
}

declare module '..' {
  export interface SGPluginOptionsMap {
    pluralQuery?: PluralQueryOptions
  }
}

export default {
  name: 'pluralQuery',
  defaultOptions: {
    enable: false
  },
  priority: 0,
  description: 'Gen `plural query` for Schema',
  applyToSchema: function pluralQuery(schema, options, schemas): void {
    const searchFields = getSearchFields(
      options.conditionFields || {},
      schema,
      schemas
    )

    const {enable, ...config} = options

    schema.queries({
      [`${StringHelper.toInitialLowerCase(
        config.name || schema.name + 's'
      )}`]: {
        hookOptions: config.hookOptions,
        output: {type: schema.name + 'Connection'},
        input: {
          ...(_.keys(searchFields).length > 0
            ? {
              condition: {
                elements: {
                  properties: _.mapValues(searchFields, (fieldConfig) => {
                    const {mapper, definition} = fieldConfig
                    return definition
                  })
                },
                metadata: {
                  description: 'Query Condition'
                }
              }
            }
            : {}),
          sort: {
            elements: {
              properties: {
                field: {
                  enum: _.keys(searchFields)
                },
                order: {
                  enum: ['ASC', 'DESC']
                }
              }
            },
            metadata: {
              description: 'Define the sort field'
            }
          }
        },
        resolve: async function (args, context, info, sgContext) {
          const dbModel = sgContext.models[schema.name]

          const {sort = [{field: 'id', order: 'ASC'}], condition = []} =
          args || {}

          const queryOption = {where: {}, bind: [], attributes: []}

          if (condition && condition.length > 0) {
            const where = queryOption.where
            for (const c of condition) {
              queryOption.where = {}
              for (const key of _.keys(searchFields)) {
                await searchFields[key].mapper(queryOption, c[key], sgContext)
              }
              if (queryOption.where[Sequelize.Op.and]) {
                where[Sequelize.Op.or] = where[Sequelize.Op.or] || []
                where[Sequelize.Op.or].push({
                  [Sequelize.Op.and]: queryOption.where[Sequelize.Op.and]
                })
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
            order: sort.map((s) => [s.field, s.order])
          })
        }
      }
    })
  }
} as SGPluginConfig<PluralQueryOptions>
