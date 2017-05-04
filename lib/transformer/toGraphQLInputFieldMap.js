'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _type = require('../type');

var _type2 = _interopRequireDefault(_type);

var _ModelRef = require('../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _StringHelper = require('../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var toGraphQLInputFieldMap = function toGraphQLInputFieldMap(name, fields) {
  var typeName = function typeName(name, path) {
    return name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(function (v) {
      return _StringHelper2.default.toInitialUpperCase(v);
    }).join('');
  };

  var convert = function convert(name, path, field) {
    if (graphql.isInputType(field)) {
      return { type: field };
    }
    if (field instanceof _type2.default.ScalarFieldType) {
      return { type: field.graphQLInputType };
    }

    if (graphql.isCompositeType(field)) {
      return;
    }

    switch (field) {
      case String:
        return { type: graphql.GraphQLString };
      case Number:
        return { type: graphql.GraphQLFloat };
      case Boolean:
        return { type: graphql.GraphQLBoolean };
      case Date:
        return { type: _type2.default.GraphQLScalarTypes.Date };
      case JSON:
        return { type: _type2.default.GraphQLScalarTypes.Json };
    }

    if (_lodash2.default.isArray(field)) {
      var subField = convert(name, path, field[0]);
      if (!subField) return;

      return _extends({}, subField, {
        type: new graphql.GraphQLList(subField.type)
      });
    }

    if (field instanceof _ModelRef2.default) {
      return {
        type: _type2.default.GraphQLScalarTypes.globalIdInputType(field.name)
      };
    }
    if (field instanceof Object) {
      if (field['$type']) {
        var result = void 0;
        if (field['enumValues']) {
          var values = {};
          field['enumValues'].forEach(function (t) {
            values[t] = { value: t };
          });
          result = {
            type: new graphql.GraphQLEnumType({
              name: typeName(name, path),
              values: values
            })
          };
        } else {
          result = convert(name, path, field['$type']);
        }
        if (result) {
          result.description = field['description'];
          if (field['default'] != null && !_lodash2.default.isFunction(field['default'])) {
            result.defaultValue = field['default'];
            result.description = (result.description ? result.description : '') + ' 默认值:' + result.defaultValue;
          }
        }
        return result;
      } else {
        var inputType = graphQLInputType(typeName(name, path), field);
        if (inputType) {
          return { type: inputType };
        } else {}
      }
    }
  };

  var graphQLInputType = function graphQLInputType(name, config) {
    name = _StringHelper2.default.toInitialUpperCase(name);

    if (config['$type']) {
      var result = convert(name, '', config);
      if (result && result.type) {
        return result.type;
      } else {
        // return null
      }
    } else {
      var _fields = toGraphQLInputFieldMap(name, config);
      if (_lodash2.default.keys(_fields).length === 0) {
        // return null
      }
      return new graphql.GraphQLInputObjectType({
        name: name + 'Input',
        fields: _fields
      });
    }
  };

  var fieldMap = {};

  _lodash2.default.forOwn(fields, function (value, key) {
    if (value['$type'] && (value['hidden'] || value['resolve'])) {
      // Hidden field, ignore
      // Have resolve method, ignore
    } else {
      var inputField = convert(name, key, value);
      if (inputField) {
        if (value['$type'] && value['required']) {
          fieldMap[key] = inputField;
          if (fieldMap[key] && !(inputField.type instanceof graphql.GraphQLNonNull)) {
            fieldMap[key].type = new graphql.GraphQLNonNull(inputField.type);
          }
        } else {
          fieldMap[key] = inputField;
        }
      }
    }
  });
  return fieldMap;
};

exports.default = toGraphQLInputFieldMap;