import Sequelize, { Model, ModelAttributeColumnOptions, ModelCtor } from 'sequelize'
import Schema from '../definition/Schema'
import { ColumnFieldOptionsType, FieldTypeContext, ModelDefine, SGContext } from '../Definition'
import _ from 'lodash'
import staticsMethods from './modelStaticsMethod'

function toSequelizeModel (sequelize: Sequelize.Sequelize, schema: Schema, context: FieldTypeContext): ModelCtor<Model> {
  const dbDefinition = {}

  const versionConfig = (schema.config.options.tableOptions || {}).version
  let versionField = null
  if (versionConfig === true || typeof versionConfig === 'string') {
    versionField = typeof versionConfig === 'string' ? versionConfig : 'version'
  }

  _.forOwn(schema.config.fields, (value, key) => {
    if (key === versionField) return
    let typeName = value
    if (value && (<ColumnFieldOptionsType>value).$type) {
      typeName = (<ColumnFieldOptionsType>value).$type
    }

    let columnOptions: ModelAttributeColumnOptions | null | undefined = null
    if (typeName instanceof Set) {
      columnOptions = {
        type: Sequelize.STRING(191)
      }
    } else if (_.isArray(typeName)) {
      columnOptions = {
        type: Sequelize.JSON
      }
    } else if (typeof typeName === 'string') {
      const fieldType = context.fieldType(typeName)
      if (!fieldType) {
        throw new Error(`Type "${typeName}" has not register.`)
      }
      if (!fieldType.columnOptions) {
        throw new Error(`Column type of "${typeName}" is not supported.`)
      }
      columnOptions = typeof fieldType.columnOptions === 'function' ? fieldType.columnOptions(schema, key, value) : fieldType.columnOptions
    } else {
      columnOptions = {
        type: Sequelize.JSON
      }
    }
    if (columnOptions) {
      dbDefinition[key] = { ...columnOptions }
      if (value && (<ColumnFieldOptionsType>value).$type) {
        if ((<ColumnFieldOptionsType>value).required != null) {
          dbDefinition[key].allowNull = !(<ColumnFieldOptionsType>value).required
        }
        if ((<ColumnFieldOptionsType>value).default != null) {
          dbDefinition[key].defaultValue = (<ColumnFieldOptionsType>value).default
        }
        dbDefinition[key] = { ...dbDefinition[key], ...((<ColumnFieldOptionsType>value).columnOptions || {}) }
      }
      // TODO underscored support
      // if ((sequelize.options.define || {}).underscored && dbDefinition[key].field == null) {
      //     dbDefinition[key].field = StringHelper.toUnderscoredName(key);
      // }
    }
  })
  sequelize.define(schema.name, dbDefinition, schema.config.options.tableOptions)
  return sequelize.model(schema.name)
}

function buildModelAssociations (schemas: Array<Schema>, models: {
    [id: string]: ModelDefine;
}) {
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

export default (sequelize: Sequelize.Sequelize, schemas: Array<Schema>, context: SGContext): Array<ModelDefine> => {
  const result: {
        [id: string]: ModelDefine;
    } = {}
  for (const schema of schemas) {
    if (result[schema.name]) {
      throw new Error(`Schema ${schema.name} already define.`)
    }
    const model: any = toSequelizeModel(schema.sequelize || sequelize, schema, context)
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
