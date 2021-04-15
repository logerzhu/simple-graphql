import Sequelize, {
  Model,
  ModelAttributeColumnOptions,
  ModelCtor
} from 'sequelize'
import { SGSchema } from '../definition/SGSchema'
import _ from 'lodash'
import staticsMethods from './modelStaticsMethod'
import StringHelper from '../utils/StringHelper'
import { ModelAttributes } from 'sequelize/types/lib/model'
import { SGContext, SGModelCtrl, SGTypeContext } from '..'

function toSequelizeModel(
  sequelize: Sequelize.Sequelize,
  schema: SGSchema,
  context: SGTypeContext
): ModelCtor<Model> {
  const dbDefinition: { [key: string]: ModelAttributeColumnOptions } = {}

  const versionConfig = (schema.options.tableOptions || {}).version
  let versionField: string | null = null
  if (versionConfig === true || typeof versionConfig === 'string') {
    versionField = typeof versionConfig === 'string' ? versionConfig : 'version'
  }

  _.forOwn(schema.config.fields, (value, key) => {
    if (key === versionField) return

    let columnOptions: ModelAttributeColumnOptions | null | undefined = null

    if (value.enum) {
      columnOptions = {
        type: Sequelize.STRING(191)
      }
    } else if (value.elements) {
      columnOptions = {
        type: Sequelize.JSON
      }
    } else if (value.type) {
      const typeConfig = context.typeConfig(value.type)
      if (!typeConfig) {
        throw new Error(`Type "${value.type}" has not register.`)
      }
      if (!typeConfig.columnOptions) {
        throw new Error(`Column type of "${value.type}" is not supported.`)
      }
      columnOptions =
        typeof typeConfig.columnOptions === 'function'
          ? typeConfig.columnOptions(schema, key, value)
          : typeConfig.columnOptions
    } else {
      columnOptions = {
        type: Sequelize.JSON
      }
    }
    if (columnOptions) {
      dbDefinition[key] = { ...columnOptions }
      dbDefinition[key].allowNull = value.nullable !== false
      dbDefinition[key] = {
        ...dbDefinition[key],
        ...(value.metadata?.column || {})
      }
    }
  })
  sequelize.define(schema.name, dbDefinition, schema.options.tableOptions)
  return sequelize.model(schema.name)
}

function buildModelAssociations(
  schemas: Array<SGSchema>,
  models: {
    [id: string]: SGModelCtrl
  }
) {
  for (const schema of schemas) {
    _.forOwn(schema.config.associations.hasMany, (config, key) => {
      models[schema.name].hasMany(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignKey || config.foreignField + 'Id'
      })
    })

    _.forOwn(schema.config.associations.belongsToMany, (config, key) => {
      models[schema.name].belongsToMany(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignField + 'Id',
        // through: config.through && {...config.through, model: models[config.through.model]}
        through: config.through
      })
    })

    _.forOwn(schema.config.associations.hasOne, (config, key) => {
      models[schema.name].hasOne(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignKey || config.foreignField + 'Id'
      })
    })

    _.forOwn(schema.config.associations.belongsTo, (config, key) => {
      models[schema.name].belongsTo(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignKey || config.foreignField + 'Id',
        targetKey: config.targetKey || 'id'
      })
    })
  }
}

export default (
  sequelize: Sequelize.Sequelize,
  schemas: Array<SGSchema>,
  context: SGContext
): Array<SGModelCtrl> => {
  const result: {
    [id: string]: SGModelCtrl
  } = {}
  for (const schema of schemas) {
    if (result[schema.name]) {
      throw new Error(`Schema ${schema.name} already define.`)
    }
    const model: any = toSequelizeModel(
      schema.sequelize || sequelize,
      schema,
      context
    )
    Object.assign(model, {
      sgSchema: schema,
      ...staticsMethods,
      ...schema.config.statics,
      getSGContext: () => context
    })
    Object.assign(model.prototype, {
      getSGContext: () => context,
      _fieldType: schema.name,
      ...schema.config.methods
    })
    result[schema.name] = model
  }
  buildModelAssociations(schemas, result)
  return _.values(result)
}
