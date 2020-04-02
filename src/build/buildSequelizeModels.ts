
import { ModelAttributeColumnOptions } from "sequelize";
import Sequelize from "sequelize";
import Schema from "../definition/Schema";
import { FieldTypeContext, ModelDefine, SGContext } from "../Definition";
import _ from "lodash";
import StringHelper from "../utils/StringHelper";
import staticsMethods from "./modelStaticsMethod";

function toSequelizeModel(sequelize: Sequelize, schema: Schema, context: FieldTypeContext): ModelDefine {
  const dbDefinition = {};

  const versionConfig = (schema.config.options.tableOptions || {}).version;
  let versionField = null;
  if (versionConfig === true || typeof versionConfig === 'string') {
    versionField = typeof versionConfig === 'string' ? versionConfig : 'version';
  }

  _.forOwn(schema.config.fields, (value, key) => {
    if (key === versionField) return;
    let typeName = value;
    if (value && value.$type) {
      typeName = value.$type;
    }

    let columnOptions: ModelAttributeColumnOptions | null | undefined = null;
    if (typeName instanceof Set) {
      columnOptions = {
        type: Sequelize.STRING(191)
      };
    } else if (_.isArray(typeName)) {
      columnOptions = {
        type: Sequelize.JSON
      };
    } else if (typeof typeName === 'string') {
      const fieldType = context.fieldType(typeName);
      if (!fieldType) {
        throw new Error(`Type "${typeName}" has not register.`);
      }
      if (!fieldType.columnOptions) {
        throw new Error(`Column type of "${typeName}" is not supported.`);
      }
      columnOptions = typeof fieldType.columnOptions === 'function' ? fieldType.columnOptions(schema, key, value) : fieldType.columnOptions;
    } else {
      columnOptions = {
        type: Sequelize.JSON
      };
    }
    if (columnOptions) {
      dbDefinition[key] = { ...columnOptions };
      if (value && value.$type) {
        if (value.required != null) {
          dbDefinition[key].allowNull = !value.required;
        }
        if (value.default != null) {
          dbDefinition[key].defaultValue = value.default;
        }
        dbDefinition[key] = { ...dbDefinition[key], ...(value.columnOptions || {}) };
      }
      if ((sequelize.options.define || {}).underscored && dbDefinition[key].field == null) {
        dbDefinition[key].field = StringHelper.toUnderscoredName(key);
      }
    }
  });
  return sequelize.define(schema.name, dbDefinition, schema.config.options.tableOptions);
}

function buildModelAssociations(schemas: Array<Schema>, models: {
  [id: string]: ModelDefine;
}) {
  for (let schema of schemas) {
    _.forOwn(schema.config.associations.hasMany, (config, key) => {
      models[schema.name].hasMany(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignKey || config.foreignField + 'Id',
        through: undefined
      });
    });

    _.forOwn(schema.config.associations.belongsToMany, (config, key) => {
      models[schema.name].belongsToMany(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignField + 'Id',
        through: config.through && { ...config.through, model: models[config.through.model] }
      });
    });

    _.forOwn(schema.config.associations.hasOne, (config, key) => {
      models[schema.name].hasOne(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignKey || config.foreignField + 'Id'
      });
    });

    _.forOwn(schema.config.associations.belongsTo, (config, key) => {
      models[schema.name].belongsTo(models[config.target], {
        ...config,
        as: key,
        foreignKey: config.foreignKey || config.foreignField + 'Id',
        targetKey: config.targetKey || 'id'
      });
    });
  }
}

export default ((sequelize: Sequelize.Sequelize, schemas: Array<Schema>, context: SGContext): Array<ModelDefine> => {
  const result: {
    [id: string]: ModelDefine;
  } = {};
  for (let schema of schemas) {
    if (result[schema.name]) {
      throw new Error(`Schema ${schema.name} already define.`);
    }
    const model = toSequelizeModel(schema.sequelize || sequelize, schema, context);
    Object.assign(model, {
      schema: schema,
      ...staticsMethods,
      ...schema.config.statics,
      getSGContext: () => context
    });
    Object.assign(model.prototype, {
      getSGContext: () => context,
      _fieldType: schema.name,
      ...schema.config.methods
    });
    result[schema.name] = model;
  }
  buildModelAssociations(schemas, result);
  return _.values(result);
});