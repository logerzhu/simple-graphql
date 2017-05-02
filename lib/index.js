'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _graphqlRelay = require('graphql-relay');

var relay = _interopRequireWildcard(_graphqlRelay);

var _Model = require('./Model');

var _Model2 = _interopRequireDefault(_Model);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _Context = require('./Context');

var _Context2 = _interopRequireDefault(_Context);

var _StringHelper = require('./utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _Connection = require('./Connection');

var _Connection2 = _interopRequireDefault(_Connection);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GS = {};

GS.ScalarTypes = {
  Id: { graphQLType: graphql.GraphQLID, columnType: _sequelize2.default.INTEGER },
  String: { graphQLType: graphql.GraphQLString, columnType: _sequelize2.default.STRING },
  Float: { graphQLType: graphql.GraphQLFloat, columnType: _sequelize2.default.DOUBLE },
  Int: { graphQLType: graphql.GraphQLInt, columnType: _sequelize2.default.INTEGER },
  Boolean: { graphQLType: graphql.GraphQLBoolean, columnType: _sequelize2.default.BOOLEAN },
  Date: { graphQLType: _type2.default.Date, columnType: _sequelize2.default.DATE },
  JSON: { graphQLType: _type2.default.Json, columnType: _sequelize2.default.JSONB }
};

GS.Connection = _Connection2.default;

GS.Model = _Model2.default;

GS.ModelRef = function () {
  function _class(name) {
    _classCallCheck(this, _class);

    this.name = name;
  }

  return _class;
}();

GS.model = function (name) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return new _Model2.default(name, options);
};

GS.modelRef = function (name) {
  return new GS.ModelRef(name);
};

GS.FilterConfig = function () {
  function _class2(fields, includeFieldFilter) {
    _classCallCheck(this, _class2);

    this.fields = fields;
    this.includeFieldFilter = includeFieldFilter;
  }

  return _class2;
}();

GS.graphQLInputFieldMap = function (name, fields, includeFieldFilter) {
  var typeName = function typeName(name, path) {
    return name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(function (v) {
      return _StringHelper2.default.toInitialUpperCase(v);
    }).join("");
  };

  var convert = function convert(name, path, field) {
    if (graphql.isInputType(field)) {
      return { type: field };
    }
    if (field && field.graphQLType && graphql.isInputType(field.graphQLType)) {
      return { type: field.graphQLType };
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
        return { type: _type2.default.Date };
      case JSON:
        return { type: _type2.default.Json };
    }

    if (_lodash2.default.isArray(field)) {
      var subField = convert(name, path, field[0]);
      if (!subField) return;

      return {
        type: new graphql.GraphQLList(subField.type)
      };
    }

    if (field instanceof GS.ModelRef) {
      return {
        type: _type2.default.globalIdInputType(field.name)
      };
    }
    if (field instanceof Object) {
      if (field['$type']) {
        var result = void 0;
        if (field['enumValues']) {
          var values = {};
          field['enumValues'].forEach(function (t) {
            return values[t] = { value: t };
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
            result.description = (result.description ? result.description : "") + " 默认值:" + result.defaultValue;
          }
        }
        return result;
      } else {
        var inputType = graphQLInputType(typeName(name, path), field);
        if (inputType) {
          return { type: inputType };
        } else {
          return;
        }
      }
    }
  };

  var graphQLInputType = function graphQLInputType(name, config) {
    name = _StringHelper2.default.toInitialUpperCase(name);

    if (config["$type"]) {
      var result = convert(name, "", config);
      if (result && result.type) {
        return result.type;
      } else {
        //return null
      }
    } else {
      var _fields = GS.graphQLInputFieldMap(name, config, includeFieldFilter);
      if (_lodash2.default.keys(_fields).length === 0) {
        //return null
      }
      return new graphql.GraphQLInputObjectType({
        name: name + "Input",
        fields: _fields
      });
    }
  };

  var fieldMap = {};

  _lodash2.default.forOwn(fields, function (value, key) {
    if (value['$type'] && (value['hidden'] || value['resolve'])) {
      //Hidden field, ignore
      //Have resolve method, ignore
    } else if (!includeFieldFilter || includeFieldFilter(key, value)) {
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

GS.graphQLFieldConfig = function (name, postfix, fieldType, context) {
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
    var elementType = GS.graphQLFieldConfig(name, postfix, fieldType[0], context).type;
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

  if (fieldType instanceof GS.ModelRef) {
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

          function resolve(_x3, _x4, _x5, _x6) {
            return _ref2.apply(this, arguments);
          }

          return resolve;
        }()
      })
    };
  }

  if (fieldType instanceof GS.Connection.ConnectionType) {
    return {
      type: context.connectionType(fieldType.nodeType)
    };
  }

  if (fieldType instanceof GS.Connection.EdgeType) {
    return {
      type: context.edgeType(fieldType.nodeType)
    };
  }

  if (fieldType instanceof Object) {
    if (fieldType['$type']) {
      var result = GS.graphQLFieldConfig(name, postfix, fieldType["$type"], context);
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
        result['args'] = GS.graphQLInputFieldMap(typeName(name), fieldType['args'], function (k, v) {
          return true;
        });
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
                fields[key] = GS.graphQLFieldConfig(name + postfix + "." + key, "", value, context);
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

          function resolve(_x7) {
            return _ref3.apply(this, arguments);
          }

          return resolve;
        }()
      };
    }
  }
  throw new Error("Unsupported type: " + fieldType);
};

GS.build = function (sequelize, models, options) {
  var context = new _Context2.default(sequelize);

  //添加Model
  models.forEach(function (model) {
    context.addModel(model);
  });

  context.buildModelAssociations();

  var finalQueries = {};

  _lodash2.default.forOwn(context.queries, function (value, key) {
    finalQueries[key] = {
      type: GS.graphQLFieldConfig(key, "Payload", value.$type, context).type,
      resolve: context.wrapResolve("query", value),
      description: value.description
    };
    if (value.args) {
      if (value.args instanceof GS.FilterConfig) {
        finalQueries[key].args = GS.graphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), value.args.fields, value.args.includeFieldFilter);
      } else {
        finalQueries[key].args = GS.graphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), value.args, function (k, v) {
          return true;
        });
      }
    }
  });

  var nodeConfig = {
    name: 'node',
    description: 'Fetches an object given its ID',
    type: context.nodeInterface,
    args: {
      id: {
        type: new graphql.GraphQLNonNull(graphql.GraphQLID),
        description: 'The ID of an object'
      }
    },
    resolve: context.wrapResolve("query", {
      name: "node",
      $type: context.nodeInterface,
      resolve: function () {
        var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(args, info, models, invoker) {
          var id, record;
          return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  id = relay.fromGlobalId(args.id);

                  if (context.models[id.type]) {
                    _context4.next = 3;
                    break;
                  }

                  return _context4.abrupt('return', null);

                case 3:
                  _context4.next = 5;
                  return models[id.type].findOne({ where: { id: id.id } });

                case 5:
                  record = _context4.sent;

                  if (record) {
                    record._type = id.type;
                  }
                  return _context4.abrupt('return', record);

                case 8:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, this);
        }));

        function resolve(_x8, _x9, _x10, _x11) {
          return _ref4.apply(this, arguments);
        }

        return resolve;
      }()
    })
  };

  var viewerInstance = {
    _type: 'Viewer',
    id: relay.toGlobalId("Viewer", "viewer")
  };

  var viewerType = new graphql.GraphQLObjectType({
    name: 'Viewer',
    interfaces: [context.nodeInterface],
    fields: function fields() {
      return Object.assign({ id: { type: new graphql.GraphQLNonNull(graphql.GraphQLID) }, node: nodeConfig }, finalQueries);
    }
  });

  return new graphql.GraphQLSchema({
    query: new graphql.GraphQLObjectType({
      name: 'RootQuery',
      fields: function fields() {
        return Object.assign({
          viewer: {
            type: viewerType,
            resolve: function resolve() {
              return viewerInstance;
            }
          },
          node: nodeConfig
        }, finalQueries);
      }
    }),
    mutation: new graphql.GraphQLObjectType({
      name: 'RootMutation',
      fields: function fields() {
        var fields = {};
        _lodash2.default.forOwn(context.mutations, function (value, key) {
          var inputFields = void 0;
          if (value.inputFields instanceof GS.FilterConfig) {
            inputFields = GS.graphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), value.inputFields.fields, value.inputFields.includeFieldFilter);
          } else {
            inputFields = GS.graphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), value.inputFields, function (k, v) {
              return true;
            });
          }
          var outputFields = { viewer: { type: viewerType, resolve: function resolve() {
                return viewerInstance;
              } } };
          _lodash2.default.forOwn(value.outputFields, function (fValue, fKey) {
            outputFields[fKey] = GS.graphQLFieldConfig(key + "." + fKey, "Payload", fValue, context);
          });
          if (!value["name"]) {
            value["name"] = key;
          }
          fields[key] = _type2.default.mutationWithClientMutationId({
            name: _StringHelper2.default.toInitialUpperCase(key),
            inputFields: inputFields,
            outputFields: outputFields,
            mutateAndGetPayload: context.wrapMutateAndGetPayload('mutation', value),
            description: value.doc
          });
        });
        return fields;
      }
    })
  });
};

exports.default = GS;