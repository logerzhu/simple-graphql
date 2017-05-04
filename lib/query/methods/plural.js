'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = pluralQuery;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _Model = require('../../Model');

var _Model2 = _interopRequireDefault(_Model);

var _type = require('../../type');

var _type2 = _interopRequireDefault(_type);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var SortEnumType = new graphql.GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASC: { value: 'ASC', description: '递增排序' },
    DESC: { value: 'DESC', description: '递减排序' }
  }
});

var DateConditionType = new graphql.GraphQLInputObjectType({
  name: 'DateCondition' + 'Input',
  fields: {
    gte: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '大于或等于'
    },
    lte: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '小于或等于'
    },
    gt: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '大于'
    },
    lt: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '小于'
    },
    ne: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '不等于'
    },
    eq: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '等于'
    }
  }
});

var NumberConditionType = new graphql.GraphQLInputObjectType({
  name: 'NumberCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLFloat,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLFloat,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLFloat,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLFloat,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLFloat,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLFloat,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '在里面'
    },
    notIn: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '不在里面'
    }
  }
});

var StringConditionType = new graphql.GraphQLInputObjectType({
  name: 'StringCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLString,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLString,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLString,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLString,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLString,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLString,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '在里面'
    },
    nin: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '不在里面'
    }
  }
});

function pluralQuery(model) {
  var name = _StringHelper2.default.toInitialLowerCase(model.name) + 's';

  var searchFields = {};
  var conditionFieldKeys = [];
  // 过滤不可搜索的field
  _.forOwn(model.config.fields, function (value, key) {
    if (!value['$type'] || value['searchable'] !== false && value['hidden'] !== true && !value['resolve']) {
      if (value['required']) {
        searchFields[key] = Object.assign({}, value, { required: false });
      } else {
        searchFields[key] = value;
      }
      if (value['default'] != null) {
        searchFields[key] = Object.assign({}, searchFields[key], { default: null });
      }
      if (value['advancedSearchable']) {
        if (value['$type'] === Date) {
          conditionFieldKeys.push(key);
          searchFields[key] = Object.assign({}, searchFields[key], { $type: DateConditionType });
        } else if (value['$type'] === Number) {
          conditionFieldKeys.push(key);
          searchFields[key] = Object.assign({}, searchFields[key], { $type: NumberConditionType });
        } else if (value['$type'] === String) {
          conditionFieldKeys.push(key);
          searchFields[key] = Object.assign({}, searchFields[key], { $type: StringConditionType });
        }
      }
    }
  });

  // 生产
  return {
    name: name,
    $type: _index2.default.Connection.connectionType(_index2.default.modelRef(model.name)),
    args: _extends({
      condition: {
        $type: _.mapValues(searchFields, function (value) {
          var type = value;
          while (type['$type'] || _.isArray(type)) {
            if (type['$type']) {
              type = type['$type'];
            } else if (_.isArray(type)) {
              type = type[0];
            }
          }
          if (value['$type']) {
            type = Object.assign({}, value, { $type: type, required: false });
          }
          if (type === Date || type['$type'] === Date) {
            type = DateConditionType;
          }
          return type;
        }),
        doc: 'Query Condition'
      },
      sort: {
        $type: [{ field: String, order: SortEnumType }],
        doc: 'Define the sort field'
      }
    }, _index2.default.Connection.args),
    resolve: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args, context, info, models) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                conditionFieldKeys.forEach(function (fieldKey) {
                  if (args['condition'] && args['condition'][fieldKey]) {
                    args['condition'][fieldKey] = _.mapKeys(args['condition'][fieldKey], function (value, key) {
                      return '$' + key;
                    });
                  }
                });

                return _context.abrupt('return', _index2.default.Connection.resolve(models[model.name], args));

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function resolve(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return resolve;
    }()
  };
}