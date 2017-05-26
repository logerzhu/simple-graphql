// @flow
import _ from 'lodash'

import Sequelize from 'sequelize'

import Type from '../type'
import Model from '../Model'
import ModelRef from '../ModelRef'
import StringHelper from '../utils/StringHelper'

export default function toSequelizeModel (sequelize:Sequelize, model:Model):Sequelize.Model {
  const dbDefinition = {}

  const dbType = (fieldType:any) => {
    if (fieldType instanceof Type.ScalarFieldType) {
      return fieldType.columnType
    }
    switch (fieldType) {
      case String:
        return Sequelize.STRING
      case Number:
        return Sequelize.DOUBLE
      case Boolean:
        return Sequelize.BOOLEAN
      case Date:
        return Sequelize.DATE
      case JSON:
        return Sequelize.JSONB
    }
    return null
  }
  _.forOwn(model.config.fields, (value, key) => {
    let fType = value
    if (value && value['$type']) {
      fType = value['$type']
    }
    if (fType instanceof ModelRef) {
      let foreignKey = key + 'Id'
      if (sequelize.options.define.underscored) {
        foreignKey = StringHelper.toUnderscoredName(foreignKey)
      }
      if (value && value['$type'] && value.required) {
        model.belongsTo({
          target: fType.name,
          hidden: true,
          options: {as: key, foreignKey: foreignKey, constraints: true}
        })
      } else {
        model.belongsTo({
          target: fType.name,
          hidden: true,
          options: {as: key, foreignKey: foreignKey, constraints: false}
        })
      }
    } else {
      const type = dbType(fType)
      if (type) {
        if (value && value['$type']) {
          dbDefinition[key] = {type: type}
          if (value.required != null) {
            dbDefinition[key].allowNull = !value.required
          }
          if (value.default != null) {
            dbDefinition[key].defaultValue = value.default
          }
          if (value.validate != null) {
            dbDefinition[key].validate = value.validate
          }
          if (value.enumValues != null) {
            dbDefinition[key].type = Sequelize.ENUM(...value.enumValues)
          }
          dbDefinition[key] = {...dbDefinition[key], ...value.column}
        } else {
          dbDefinition[key] = {type: type}
        }
        if (sequelize.options.define.underscored && dbDefinition[key].field == null) {
          dbDefinition[key].field = StringHelper.toUnderscoredName(key)
        }
      } else {
        throw new Error('Unknown column type for ', fType)
      }
    }
  })
  // console.log("Create Sequlize Model with config", model.name, dbDefinition, model.config.options["table"])
  const dbModel = sequelize.define(model.name, dbDefinition, model.config.options['table'])
  return dbModel
}
