//@flow
import _ from 'lodash'

import Sequelize from 'sequelize'

import Type from '../type'
import Model from '../Model'
import ModelRef from '../ModelRef'

export default function toSequelizeModel(sequelize:Sequelize, model:Model):Sequelize.Model {
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
  _.forOwn(model.config.fields, (value, key)=> {
    let fType = value
    if (value && value["$type"]) {
      fType = value["$type"]
    }
    if (fType instanceof ModelRef) {
      if (value && value["$type"] && value.required) {
        model.belongsTo({target: fType.name, options: {as: key, foreignKey: key + "Id", constraints: true}})
      } else {
        model.belongsTo({target: fType.name, options: {as: key, foreignKey: key + "Id", constraints: false}})
      }

    } else {
      const type = dbType(fType)
      if (type) {
        if (value && value["$type"]) {
          dbDefinition[key] = {type: type}
          if (value.required != null) {
            dbDefinition[key].allowNull = !value.required
          }
          if (value.defaultValue != null) {
            dbDefinition[key].defaultValue = value.defaultValue
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
      }
    }
  })
  //console.log("Create Sequlize Model with config", model.name, dbDefinition, model.config.options["table"])
  return sequelize.define(model.name, dbDefinition, model.config.options["table"])
}