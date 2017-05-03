"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphql = require("graphql");

var graphql = _interopRequireWildcard(_graphql);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScalarFieldType = function ScalarFieldType(config) {
  _classCallCheck(this, ScalarFieldType);

  this.name = config.name;
  this.description = config.description;
  this.graphQLInputType = config.graphQLInputType;
  this.graphQLOutputType = config.graphQLOutputType;
  this.columnType = config.columnType;
};

exports.default = ScalarFieldType;