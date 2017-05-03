'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = globalIdInputType;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * 生产 query or mutation 的inputType,自动把globalId 转换回  id
 * @param typeName
 * @returns {"graphql".GraphQLScalarType<string>}
 */

function defGlobalIdInputType(typeName) {
  return new _graphql.GraphQLScalarType({
    name: typeName + 'Id',
    description: "Global id of " + typeName,
    serialize: function serialize(value) {
      throw new Error('Unsupported!!');
    },
    parseValue: function parseValue(value) {
      if (typeof value === "string") {
        var _fromGlobalId = (0, _graphqlRelay.fromGlobalId)(value),
            type = _fromGlobalId.type,
            _id = _fromGlobalId.id;

        if (type === typeName) {
          return _id;
        }
        throw new Error("Incorrect globalId type: " + type);
      } else {
        throw new Error("Incorrect globalId format: ", value);
      }
    },
    parseLiteral: function parseLiteral(ast) {
      if (ast.kind !== _graphql.Kind.STRING) {
        throw new _graphql.GraphQLError('Query error: Can only parse string to GrobalId but got a: ' + ast.kind, [ast]);
      }
      var value = ast.value;
      if (typeof value === "string") {
        var _fromGlobalId2 = (0, _graphqlRelay.fromGlobalId)(value),
            type = _fromGlobalId2.type,
            _id2 = _fromGlobalId2.id;

        if (type === typeName) {
          return _id2;
        }
        throw new Error("Incorrect globalId type: " + type);
      } else {
        throw new Error("Incorrect globalId format: ", value);
      }
    }
  });
}

var types = {};

/**
 * 返回指定类型的Global ID input
 * @param typeName
 * @returns {GraphQLScalarType<string>}
 */
function globalIdInputType(typeName) {
  if (!types[typeName]) {
    types[typeName] = defGlobalIdInputType(typeName);
  }
  return types[typeName];
}