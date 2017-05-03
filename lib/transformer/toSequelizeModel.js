'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = toSequelizeModel;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _type = require('../type');

var _type2 = _interopRequireDefault(_type);

var _Model = require('../Model');

var _Model2 = _interopRequireDefault(_Model);

var _ModelRef = require('../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function toSequelizeModel(sequelize, model) {
  var dbDefinition = {};

  var dbType = function dbType(fieldType) {
    if (fieldType instanceof _type2.default.ScalarFieldType) {
      return fieldType.columnType;
    }
    switch (fieldType) {
      case String:
        return _sequelize2.default.STRING;
      case Number:
        return _sequelize2.default.DOUBLE;
      case Boolean:
        return _sequelize2.default.BOOLEAN;
      case Date:
        return _sequelize2.default.DATE;
      case JSON:
        return _sequelize2.default.JSONB;
    }
    return null;
  };
  _lodash2.default.forOwn(model.config.fields, function (value, key) {
    var fType = value;
    if (value && value["$type"]) {
      fType = value["$type"];
    }
    if (fType instanceof _ModelRef2.default) {
      if (value && value["$type"] && value.required) {
        model.belongsTo({ target: fType.name, options: { as: key, foreignKey: key + "Id", constraints: true } });
      } else {
        model.belongsTo({ target: fType.name, options: { as: key, foreignKey: key + "Id", constraints: false } });
      }
    } else {
      var type = dbType(fType);
      if (type) {
        if (value && value["$type"]) {
          dbDefinition[key] = { type: type };
          if (value.required != null) {
            dbDefinition[key].allowNull = !value.required;
          }
          if (value.defaultValue != null) {
            dbDefinition[key].defaultValue = value.defaultValue;
          }
          if (value.validate != null) {
            dbDefinition[key].validate = value.validate;
          }
          if (value.enumValues != null) {
            dbDefinition[key].type = _sequelize2.default.ENUM.apply(_sequelize2.default, _toConsumableArray(value.enumValues));
          }
          dbDefinition[key] = _extends({}, dbDefinition[key], value.column);
        } else {
          dbDefinition[key] = { type: type };
        }
      }
    }
  });
  //console.log("Create Sequlize Model with config", model.name, dbDefinition, model.config.options["table"])
  return sequelize.define(model.name, dbDefinition, model.config.options["table"]);
}