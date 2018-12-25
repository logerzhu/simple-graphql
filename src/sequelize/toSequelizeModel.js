// @flow
import _ from 'lodash'

import Sequelize from 'sequelize'

import Type from '../type'
import Schema from '../definition/Schema'
import StringHelper from '../utils/StringHelper'

export default function toSequelizeModel (sequelize:Sequelize, schema:Schema<any>):Sequelize.Model {
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
        return Sequelize.DATE(6)
      case JSON:
        return Sequelize.JSON
    }
    return Sequelize.JSON
  }
  _.forOwn(schema.config.fields, (value, key) => {
    let fType = value
    if (value && value['$type']) {
      fType = value['$type']
    }
    if (typeof fType === 'string') {
      let foreignField = key
      let onDelete = 'RESTRICT'
      if (value && value['$type'] && value.column) {
        if (value.column.onDelete) {
          onDelete = value.column.onDelete
        }
      }
      if (value && value['$type'] && value.required) {
        schema.belongsTo({
          [key]: {
            target: fType,
            hidden: true,
            foreignField: foreignField,
            foreignKey: {name: foreignField + 'Id', allowNull: false},
            onDelete: onDelete,
            constraints: true
          }
        })
      } else {
        schema.belongsTo({
          [key]: {
            target: fType,
            hidden: true,
            foreignField: foreignField,
            onDelete: onDelete,
            constraints: true
          }
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
        throw new Error('Unknown column type for ' + fType)
      }
    }
  })
  // console.log("Create Sequlize Model with config", model.name, dbDefinition, model.config.options["table"])
  const dbModel = sequelize.define(schema.name, dbDefinition, schema.config.options['table'])
  dbModel.buildInclude = function (fragments:Object, selectionSet:Object) {
    const buildSelections = function (selections:Array<Object>) {
      const result = []
      if (selections) {
        selections.forEach(selection => {
          if (selection.kind === 'Field') {
            const selectionSet = selection.selectionSet
            return result.push({
              name: selection.name.value,
              selections: selectionSet && buildSelections(selectionSet.selections)
            })
          } else if (selection.kind === 'FragmentSpread') {
            const fragment = fragments[selection.name.value]
            buildSelections(fragment.selectionSet && fragment.selectionSet.selections).forEach(
              r => result.push(r)
            )
          }
        })
      }
      return result
    }

    const sgContext = this.getSGContext()
    const buildInclude = function (nSchema, selections) {
      const include = []
      if (selections) {
        for (let selection of selections) {
          const config = nSchema.config.associations.belongsTo[selection.name] || nSchema.config.associations.hasOne[selection.name]
          if (config) {
            include.push({
              model: sgContext.models[config.target],
              as: selection.name,
              include: buildInclude(sgContext.schemas[config.target], selection.selections)
            })
          }
        }
      }
      return include
    }
    const selections = buildSelections(selectionSet && selectionSet.selections)
    return buildInclude(schema, selections)
  }
  return dbModel
}
