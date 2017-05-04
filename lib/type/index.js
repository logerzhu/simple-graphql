'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphql = require('graphql');

var _graphql2 = require('./graphql');

var _graphql3 = _interopRequireDefault(_graphql2);

var _ScalarFieldType = require('./ScalarFieldType');

var _ScalarFieldType2 = _interopRequireDefault(_ScalarFieldType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  GraphQLScalarTypes: _graphql3.default,
  ScalarFieldType: _ScalarFieldType2.default,

  ScalarFieldTypes: {
    Id: new _ScalarFieldType2.default({
      name: 'Id',
      graphQLInputType: _graphql.GraphQLID,
      graphQLOutputType: _graphql.GraphQLID,
      columnType: _sequelize2.default.INTEGER
    }),
    String: new _ScalarFieldType2.default({
      name: 'String',
      graphQLInputType: _graphql.GraphQLString,
      graphQLOutputType: _graphql.GraphQLString,
      columnType: _sequelize2.default.STRING
    }),
    Float: new _ScalarFieldType2.default({
      name: 'Float',
      graphQLInputType: _graphql.GraphQLFloat,
      graphQLOutputType: _graphql.GraphQLFloat,
      columnType: _sequelize2.default.DOUBLE
    }),
    Int: new _ScalarFieldType2.default({
      name: 'Int',
      graphQLInputType: _graphql.GraphQLInt,
      graphQLOutputType: _graphql.GraphQLInt,
      columnType: _sequelize2.default.INTEGER
    }),
    Boolean: new _ScalarFieldType2.default({
      name: 'Boolean',
      graphQLInputType: _graphql.GraphQLBoolean,
      graphQLOutputType: _graphql.GraphQLBoolean,
      columnType: _sequelize2.default.BOOLEAN
    }),
    Date: new _ScalarFieldType2.default({
      name: 'Date',
      graphQLInputType: _graphql3.default.Date,
      graphQLOutputType: _graphql3.default.Date,
      columnType: _sequelize2.default.DATE
    }),
    JSON: new _ScalarFieldType2.default({
      name: 'JSON',
      graphQLInputType: _graphql3.default.Json,
      graphQLOutputType: _graphql3.default.Json,
      columnType: _sequelize2.default.JSONB
    })
  }
};