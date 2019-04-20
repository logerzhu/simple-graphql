// @flow
import type { DefineAttributeColumnOptions } from 'sequelize'
import Sequelize from 'sequelize'
import Schema from '../definition/Schema'
import type { FieldTypeContext, ModelDefine, SGContext } from '../Definition'
import _ from 'lodash'
import StringHelper from '../utils/StringHelper'
import staticsMethods from './modelStaticsMethod'

function toSequelizeModel (sequelize: Sequelize, schema: Schema, context: FieldTypeContext): ModelDefine {
  const dbDefinition = {}

  _.forOwn(schema.config.fields, (value, key) => {
    let typeName = value
    if (value && value.$type) {
      typeName = value.$type
    }

    let columnOptions: ?DefineAttributeColumnOptions = null
    if (_.isArray(typeName)) {
      columnOptions = {
        type: Sequelize.STRING(191)
      }
    } else {
      const fieldType = context.fieldType(typeName)
      if (!fieldType) {
        throw new Error(`Type "${typeName}" has not register.`)
      }
      if (!fieldType.columnOptions) {
        throw new Error(`Column type of "${typeName}" is not supported.`)
      }
      columnOptions = typeof fieldType.columnOptions === 'function' ? fieldType.columnOptions(schema, key, value) : fieldType.columnOptions
    }
    if (columnOptions) {
      dbDefinition[key] = columnOptions
      if (value && value.$type) {
        if (value.required != null) {
          dbDefinition[key].allowNull = !value.required
        }
        if (value.default != null) {
          dbDefinition[key].defaultValue = value.default
        }
        dbDefinition[key] = { ...dbDefinition[key], ...(value.column || {}) }
      }
      if ((sequelize.options.define || {}).underscored && dbDefinition[key].field == null) {
        dbDefinition[key].field = StringHelper.toUnderscoredName(key)
      }
    }
  })

  return sequelize.define(schema.name, dbDefinition, schema.config.options['table'])
}

function buildModelAssociations (schemas: Array<Schema>, models: { [id: string]: ModelDefine }) {
  for (let schema of schemas) {
    _.forOwn(schema.config.associations.hasMany, (config, key) => {
      models[schema.name].hasMany(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignKey || config.foreignField + 'Id',
        through: undefined
      })
    })

    _.forOwn(schema.config.associations.belongsToMany, (config, key) => {
      models[schema.name].belongsToMany(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignField + 'Id',
        through: config.through && { ...config.through, model: models[config.through.model] }
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

export default (sequelize: Sequelize, schemas: Array<Schema>, context: SGContext): { [id: string]: ModelDefine } => {
  const result: { [id: string]: ModelDefine } = {}
  for (let schema of schemas) {
    if (result[schema.name]) {
      throw new Error(`Schema ${schema.name} already define.`)
    }
    const model = toSequelizeModel(sequelize, schema, context)
    Object.assign(model, {
      ...schema.config.statics,
      ...staticsMethods,
      getSGContext: () => context
    })
    Object.assign(model.prototype, {
      ...schema.config.methods,
      getSGContext: () => context
    })
    result[schema.name] = model
  }
  buildModelAssociations(schemas, result)
  return result
}