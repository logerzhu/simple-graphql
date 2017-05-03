'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _type = require('../type');

var _type2 = _interopRequireDefault(_type);

var _Context = require('../Context');

var _Context2 = _interopRequireDefault(_Context);

var _StringHelper = require('../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _Connection = require('../Connection');

var _Connection2 = _interopRequireDefault(_Connection);

var _ModelRef = require('../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _toGraphQLInputFieldMap = require('./toGraphQLInputFieldMap');

var _toGraphQLInputFieldMap2 = _interopRequireDefault(_toGraphQLInputFieldMap);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var toGraphQLFieldConfig = function toGraphQLFieldConfig(name, postfix, fieldType, context) {
  var interfaces = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];


  var typeName = function typeName(path) {
    return path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(function (v) {
      return _StringHelper2.default.toInitialUpperCase(v);
    }).join("");
  };

  if (graphql.isOutputType(fieldType)) {
    return { type: fieldType };
  }
  if (fieldType && fieldType.graphQLType && graphql.isOutputType(fieldType.graphQLType)) {
    return { type: fieldType.graphQLType };
  }
  switch (fieldType) {
    case String:
      return { type: graphql.GraphQLString };
    case Number:
      return { type: graphql.GraphQLFloat };
    case Boolean:
      return { type: graphql.GraphQLBoolean };
    case Date:
      return { type: _type2.default.Date };
    case JSON:
      return { type: _type2.default.Json };
  }

  if (_lodash2.default.isArray(fieldType)) {
    var elementType = toGraphQLFieldConfig(name, postfix, fieldType[0], context).type;
    return {
      type: new graphql.GraphQLList(elementType),
      resolve: function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  return _context.abrupt('return', null);

                case 1:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function resolve() {
          return _ref.apply(this, arguments);
        }

        return resolve;
      }()
    };
  }

  if (fieldType instanceof _ModelRef2.default) {
    return {
      type: context.graphQLObjectType(fieldType.name),
      resolve: context.wrapResolve('field', {
        name: name.split("\.").slice(-1)[0],
        path: name,
        $type: context.graphQLObjectType(fieldType.name),
        resolve: function () {
          var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(root, args, info, models) {
            var fieldName;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    fieldName = name.split("\.").slice(-1)[0];
                    //判断是否只有model Id, 如果只有model Id, 通过ID 查找相关的model

                    if (!(root && _lodash2.default.isFunction(root["get" + _StringHelper2.default.toInitialUpperCase(fieldName)]))) {
                      _context2.next = 5;
                      break;
                    }

                    _context2.next = 4;
                    return root["get" + _StringHelper2.default.toInitialUpperCase(fieldName)]();

                  case 4:
                    return _context2.abrupt('return', _context2.sent);

                  case 5:
                    if (!(root && root[fieldName] && (typeof root[fieldName] === 'number' || typeof root[fieldName] === 'string'))) {
                      _context2.next = 9;
                      break;
                    }

                    _context2.next = 8;
                    return models[fieldType.name].findOne({ where: { id: root[fieldName] } });

                  case 8:
                    return _context2.abrupt('return', _context2.sent);

                  case 9:
                    return _context2.abrupt('return', root[fieldName]);

                  case 10:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          function resolve(_x2, _x3, _x4, _x5) {
            return _ref2.apply(this, arguments);
          }

          return resolve;
        }()
      })
    };
  }

  if (fieldType instanceof _Connection2.default.ConnectionType) {
    return {
      type: context.connectionType(fieldType.nodeType)
    };
  }

  if (fieldType instanceof _Connection2.default.EdgeType) {
    return {
      type: context.edgeType(fieldType.nodeType)
    };
  }

  if (fieldType instanceof Object) {
    if (fieldType['$type']) {
      var result = toGraphQLFieldConfig(name, postfix, fieldType["$type"], context);
      if (fieldType['enumValues']) {
        var values = {};
        fieldType['enumValues'].forEach(function (t) {
          return values[t] = { value: t };
        });
        result.type = new graphql.GraphQLEnumType({
          name: typeName(name) + postfix,
          values: values
        });
      }
      if (fieldType['required'] && !(result.type instanceof graphql.GraphQLNonNull)) {
        result.type = new graphql.GraphQLNonNull(result.type);
      }
      if (fieldType['resolve']) {
        result['resolve'] = fieldType['resolve'];
      }
      if (fieldType['args']) {
        result['args'] = (0, _toGraphQLInputFieldMap2.default)(typeName(name), fieldType['args']);
      }
      result.description = fieldType['description'];
      return result;
    } else {
      return {
        type: new graphql.GraphQLObjectType({
          name: typeName(name) + postfix,
          interfaces: interfaces,
          fields: function fields() {
            var fields = {};
            _lodash2.default.forOwn(fieldType, function (value, key) {
              if (value['$type'] && value['hidden']) {} else {
                fields[key] = toGraphQLFieldConfig(name + postfix + "." + key, "", value, context);
              }
            });
            return fields;
          }
        }),
        resolve: function () {
          var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(root) {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    return _context3.abrupt('return', root[name.split("\.").slice(-1)[0]]);

                  case 1:
                  case 'end':
                    return _context3.stop();
                }
              }
            }, _callee3, this);
          }));

          function resolve(_x6) {
            return _ref3.apply(this, arguments);
          }

          return resolve;
        }()
      };
    }
  }
  throw new Error("Unsupported type: " + fieldType);
};

exports.default = toGraphQLFieldConfig;