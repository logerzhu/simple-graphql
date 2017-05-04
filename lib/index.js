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

var _ModelRef = require('./ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _transformer = require('./transformer');

var _transformer2 = _interopRequireDefault(_transformer);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var GS = {};

GS.ScalarFieldTypes = _type2.default.ScalarFieldTypes;

GS.Connection = _Connection2.default;

GS.Model = _Model2.default;

GS.ModelRef = _ModelRef2.default;

GS.model = function (name) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return new _Model2.default(name, options);
};

GS.modelRef = function (name) {
  return new _ModelRef2.default(name);
};

GS.build = function (sequelize, models, options) {
  var context = new _Context2.default(sequelize);

  // 添加Model
  models.forEach(function (model) {
    context.addModel(model);
  });

  context.buildModelAssociations();

  var finalQueries = {};

  _lodash2.default.forOwn(context.queries, function (value, key) {
    finalQueries[key] = {
      type: _transformer2.default.toGraphQLFieldConfig(key, 'Payload', value.$type, context).type,
      resolve: context.wrapQueryResolve(value),
      description: value.description
    };
    if (value.args) {
      finalQueries[key].args = _transformer2.default.toGraphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), value.args);
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
    resolve: context.wrapQueryResolve({
      name: 'node',
      $type: context.nodeInterface,
      resolve: function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args, info, models, invoker) {
          var id, record;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  id = relay.fromGlobalId(args.id);

                  if (context.models[id.type]) {
                    _context.next = 3;
                    break;
                  }

                  return _context.abrupt('return', null);

                case 3:
                  _context.next = 5;
                  return models[id.type].findOne({ where: { id: id.id } });

                case 5:
                  record = _context.sent;

                  if (record) {
                    record._type = id.type;
                  }
                  return _context.abrupt('return', record);

                case 8:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function resolve(_x2, _x3, _x4, _x5) {
          return _ref.apply(this, arguments);
        }

        return resolve;
      }()
    })
  };

  var viewerInstance = {
    _type: 'Viewer',
    id: relay.toGlobalId('Viewer', 'viewer')
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
          var inputFields = _transformer2.default.toGraphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), value.inputFields);
          var outputFields = { viewer: { type: viewerType, resolve: function resolve() {
                return viewerInstance;
              } } };
          _lodash2.default.forOwn(value.outputFields, function (fValue, fKey) {
            outputFields[fKey] = _transformer2.default.toGraphQLFieldConfig(key + '.' + fKey, 'Payload', fValue, context);
          });
          if (!value['name']) {
            value['name'] = key;
          }
          fields[key] = _transformer2.default.mutationWithClientMutationId({
            name: _StringHelper2.default.toInitialUpperCase(key),
            inputFields: inputFields,
            outputFields: outputFields,
            mutateAndGetPayload: context.wrapMutateAndGetPayload(value),
            description: value.doc
          });
        });
        return fields;
      }
    })
  });
};

exports.default = GS;