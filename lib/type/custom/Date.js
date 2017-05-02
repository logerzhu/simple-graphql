'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = new _graphql.GraphQLScalarType({
  name: 'Date',

  serialize: function serialize(value) {
    if (!(value instanceof Date)) {
      throw new TypeError('Field error: value is not an instance of Date');
    }
    if (isNaN(value.getTime())) {
      throw new TypeError('Field error: value is an invalid Date');
    }
    return value.toJSON();
  },
  parseValue: function parseValue(value) {
    if (typeof value === 'string') {
      var result = (0, _moment2.default)(value);
      if (!result.isValid()) {
        throw new _graphql.GraphQLError('Query error: Invalid date', value);
      }
      return result.toDate();
    } else {
      throw new _graphql.GraphQLError("Query error: Invalid date", value);
    }
  },
  parseLiteral: function parseLiteral(ast) {
    if (ast.kind !== _graphql.Kind.STRING) {
      throw new _graphql.GraphQLError('Query error: Can only parse strings to dates but got a: ' + ast.kind, [ast]);
    }
    var result = (0, _moment2.default)(ast.value);
    if (!result.isValid()) {
      throw new _graphql.GraphQLError('Query error: Invalid date', [ast]);
    }
    return result.toDate();

    //if (ast.value !== result.toJSON()) {
    //  throw new GraphQLError('Query error: Invalid date format, only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ', [ast])
    //}
  }
});