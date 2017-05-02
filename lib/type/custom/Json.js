'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

function astToJson(ast) {
  if (ast.kind === _graphql.Kind.INT) {
    return parseInt(ast.value);
  }
  if (ast.kind === _graphql.Kind.FLOAT) {
    return parseFloat(ast.value);
  }
  if (ast.kind === _graphql.Kind.STRING) {
    return ast.value;
  }
  if (ast.kind === _graphql.Kind.BOOLEAN) {
    return new Boolean(ast.value);
  }
  if (ast.kind === _graphql.Kind.LIST) {
    return ast.values.map(astToJson);
  }
  if (ast.kind === _graphql.Kind.ENUM) {
    return ast.value;
  }
  if (ast.kind === _graphql.Kind.OBJECT) {
    var result = {};
    ast.fields.forEach(function (field) {
      result[field.name.value] = astToJson(field.value);
    });
    return result;
  }
}
exports.default = new _graphql.GraphQLScalarType({
  name: 'Json',
  serialize: function serialize(value) {
    return value;
  },
  parseValue: function parseValue(value) {
    return value;
  },
  parseLiteral: function parseLiteral(ast) {
    return astToJson(ast);
  }
});