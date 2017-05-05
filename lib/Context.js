'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _graphqlRelay = require('graphql-relay');

var relay = _interopRequireWildcard(_graphqlRelay);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _mutation = require('./mutation');

var _mutation2 = _interopRequireDefault(_mutation);

var _Model = require('./Model');

var _Model2 = _interopRequireDefault(_Model);

var _ModelRef = require('./ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _StringHelper = require('./utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _transformer = require('./transformer');

var _transformer2 = _interopRequireDefault(_transformer);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Context = function () {
  function Context(sequelize) {
    _classCallCheck(this, Context);

    this.sequelize = sequelize;
    this.options = {
      hooks: []
    };
    this.dbModels = {};
    this.models = {};
    this.graphQLObjectTypes = {};
    this.queries = {};
    this.mutations = {};

    this.connectionDefinitions = {};

    var self = this;
    this.nodeInterface = relay.nodeDefinitions(null, function (obj) {
      var type = obj._type;
      return self.graphQLObjectTypes[type];
    }).nodeInterface;
  }

  _createClass(Context, [{
    key: 'addModel',
    value: function addModel(model) {
      var _this = this;

      if (this.models[model.name]) {
        throw new Error('Model ' + model.name + ' already define.');
      }
      this.models[model.name] = model;

      _lodash2.default.forOwn(model.config.queries, function (value, key) {
        if (!value['name']) {
          value['name'] = key;
        }
        _this.addQuery(value);
      });
      if (model.config.options.singularQuery !== false) {
        this.addQuery(_query2.default.singularQuery(model));
      }
      if (model.config.options.pluralQuery !== false) {
        this.addQuery(_query2.default.pluralQuery(model));
      }

      _lodash2.default.forOwn(model.config.mutations, function (value, key) {
        if (!value['name']) {
          value['name'] = key;
        }
        _this.addMutation(value);
      });
      if (model.config.options.addMutation !== false) {
        this.addMutation(_mutation2.default.addMutation(model));
      }
      if (model.config.options.updateMutation !== false) {
        this.addMutation(_mutation2.default.updateMutation(model));
      }
      if (model.config.options.deleteMutation !== false) {
        this.addMutation(_mutation2.default.deleteMutation(model));
      }
      this.dbModel(model.name);
    }
  }, {
    key: 'addQuery',
    value: function addQuery(config) {
      if (this.queries[config.name]) {
        throw new Error('Query ' + config.name + ' already define.');
      }
      this.queries[config.name] = config;
    }
  }, {
    key: 'addMutation',
    value: function addMutation(config) {
      if (this.mutations[config.name]) {
        throw new Error('Mutation ' + config.name + ' already define.');
      }
      this.mutations[config.name] = config;
    }
  }, {
    key: 'graphQLObjectType',
    value: function graphQLObjectType(name) {
      var model = this.models[name];
      if (!model) {
        throw new Error('Model ' + name + ' not define.');
      }
      var typeName = model.name;

      if (!this.graphQLObjectTypes[typeName]) {
        var obj = Object.assign({}, model.config.fields, model.config.links);
        var interfaces = [this.nodeInterface];
        Object.assign(obj, {
          id: {
            $type: new graphql.GraphQLNonNull(graphql.GraphQLID),
            resolve: function () {
              var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(root) {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        return _context.abrupt('return', relay.toGlobalId(_StringHelper2.default.toInitialUpperCase(model.name), root.id));

                      case 1:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              function resolve(_x) {
                return _ref.apply(this, arguments);
              }

              return resolve;
            }()
          }
        });
        this.graphQLObjectTypes[typeName] = _transformer2.default.toGraphQLFieldConfig(typeName, '', obj, this, interfaces).type;
        if (this.graphQLObjectTypes[typeName] instanceof graphql.GraphQLObjectType) {
          this.graphQLObjectTypes[typeName].description = model.config.options.description;
        }
      }
      return this.graphQLObjectTypes[typeName];
    }
  }, {
    key: 'dbModel',
    value: function dbModel(name) {
      var model = this.models[name];
      if (!model) {
        throw new Error('Model ' + name + ' not define.');
      }
      var typeName = model.name;

      if (!this.dbModels[typeName]) {
        this.dbModels[typeName] = _transformer2.default.toSequelizeModel(this.sequelize, model);
        Object.assign(this.dbModels[typeName], model.config.statics);
        Object.assign(this.dbModels[typeName].Instance.prototype, model.config.methods);
      }
      return this.dbModels[typeName];
    }
  }, {
    key: 'wrapQueryResolve',
    value: function wrapQueryResolve(config) {
      var _this2 = this;

      var self = this;

      var dbModels = function dbModels() {
        return _lodash2.default.mapValues(_this2.models, function (model) {
          return self.dbModel(model.name);
        });
      };

      var invoker = function invoker(schema, context, rootValue, requestString, variableValues) {
        return graphql['graphql'](schema, requestString, rootValue, context, variableValues);
      };
      var hookFun = function hookFun(action, invokeInfo, next) {
        return next();
      };
      this.options.hooks.reverse().forEach(function (hook) {
        if (!hook.filter || hook.filter({ type: 'query', config: config })) {
          var preHook = hookFun;
          hookFun = function hookFun(action, invokeInfo, next) {
            return hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next));
          };
        }
      });

      return function (source, args, context, info) {
        return hookFun({
          type: 'query',
          config: config
        }, {
          source: source,
          args: args,
          context: context,
          info: info,
          models: dbModels()
        }, function () {
          return config.resolve(args, context, info, dbModels(), invoker.bind(null, info.schema, context, info.rootValue));
        });
      };
    }
  }, {
    key: 'wrapFieldResolve',
    value: function wrapFieldResolve(config) {
      var _this3 = this;

      var self = this;

      var dbModels = function dbModels() {
        return _lodash2.default.mapValues(_this3.models, function (model) {
          return self.dbModel(model.name);
        });
      };

      var invoker = function invoker(schema, context, rootValue, requestString, variableValues) {
        return graphql['graphql'](schema, requestString, rootValue, context, variableValues);
      };
      var hookFun = function hookFun(action, invokeInfo, next) {
        return next();
      };
      this.options.hooks.reverse().forEach(function (hook) {
        if (!hook.filter || hook.filter({ type: 'field', config: config })) {
          var preHook = hookFun;
          hookFun = function hookFun(action, invokeInfo, next) {
            return hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next));
          };
        }
      });

      return function (source, args, context, info) {
        return hookFun({
          type: 'field',
          config: config
        }, {
          source: source,
          args: args,
          context: context,
          info: info,
          models: dbModels()
        }, function () {
          return config.resolve(source, args, context, info, dbModels(), invoker.bind(null, info.schema, context, info.rootValue));
        });
      };
    }
  }, {
    key: 'wrapMutateAndGetPayload',
    value: function wrapMutateAndGetPayload(config) {
      var _this4 = this;

      var self = this;

      var dbModels = function dbModels() {
        return _lodash2.default.mapValues(_this4.models, function (model) {
          return self.dbModel(model.name);
        });
      };

      var invoker = function invoker(schema, context, rootValue, requestString, variableValues) {
        return graphql['graphql'](schema, requestString, rootValue, context, variableValues);
      };
      var hookFun = function hookFun(action, invokeInfo, next) {
        return next();
      };
      this.options.hooks.reverse().forEach(function (hook) {
        if (!hook.filter || hook.filter({ type: 'mutation', config: config })) {
          var preHook = hookFun;
          hookFun = function hookFun(action, invokeInfo, next) {
            return hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next));
          };
        }
      });

      return function (args, context, info) {
        return hookFun({
          type: 'mutation',
          config: config
        }, {
          args: args,
          context: context,
          info: info,
          models: dbModels()
        }, function () {
          return config.mutateAndGetPayload(args, context, info, dbModels(), invoker.bind(null, info.schema, context, info.rootValue));
        });
      };
    }
  }, {
    key: 'connectionDefinition',
    value: function connectionDefinition(ref) {
      if (!this.connectionDefinitions[ref.name]) {
        this.connectionDefinitions[ref.name] = relay.connectionDefinitions({
          name: _StringHelper2.default.toInitialUpperCase(ref.name),
          nodeType: this.graphQLObjectType(ref.name),
          connectionFields: {
            count: {
              type: graphql.GraphQLFloat
            }
          }
        });
      }
      return this.connectionDefinitions[ref.name];
    }
  }, {
    key: 'connectionType',
    value: function connectionType(ref) {
      return this.connectionDefinition(ref).connectionType;
    }
  }, {
    key: 'edgeType',
    value: function edgeType(ref) {
      return this.connectionDefinition(ref).edgeType;
    }
  }, {
    key: 'buildModelAssociations',
    value: function buildModelAssociations() {
      var self = this;
      _lodash2.default.forOwn(self.models, function (model, key) {
        model.config.associations.hasOne.forEach(function (config) {
          self.dbModel(model.name).hasOne(self.dbModel(config.target), config.options);
        });
        model.config.associations.belongsTo.forEach(function (config) {
          self.dbModel(model.name).belongsTo(self.dbModel(config.target), config.options);
        });
        model.config.associations.hasMany.forEach(function (config) {
          self.dbModel(model.name).hasMany(self.dbModel(config.target), config.options);
        });
        model.config.associations.belongsToMany.forEach(function (config) {
          self.dbModel(model.name).belongsToMany(self.dbModel(config.target), config.options);
        });
      });
    }
  }]);

  return Context;
}();

exports.default = Context;