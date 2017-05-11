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

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _Model = require('../../Model');

var _Model2 = _interopRequireDefault(_Model);

var _ModelRef = require('../../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _type = require('../../type');

var _type2 = _interopRequireDefault(_type);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
    if (value instanceof _ModelRef2.default || value && value.$type instanceof _ModelRef2.default) {
      if (!key.endsWith('Id')) {
        key = key + 'Id';
      }
    }
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
        description: 'Query Condition'
      },
      sort: {
        $type: [{ field: String, order: SortEnumType }],
        description: 'Define the sort field'
      },
      keywords: {
        fields: {
          $type: [String],
          required: true
        },
        value: {
          $type: String,
          required: true
        }
      }
    }, _index2.default.Connection.args),
    resolve: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args, context, info, models) {
        var dbModel, _ref2, _ref2$sort, sort, _ref2$condition, condition, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, include, _args$keywords, fields, value, keywordsCondition, associationType, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, field, fieldName, type, colFieldName;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dbModel = models[model.name];
                _ref2 = args != null ? args : {}, _ref2$sort = _ref2.sort, sort = _ref2$sort === undefined ? [{ field: 'id', order: 'ASC' }] : _ref2$sort, _ref2$condition = _ref2.condition, condition = _ref2$condition === undefined ? {} : _ref2$condition;

                if (!dbModel.options.underscored) {
                  _context.next = 22;
                  break;
                }

                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 6;

                for (_iterator = sort[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  item = _step.value;

                  item.field = _StringHelper2.default.toUnderscoredName(item.field);
                }
                _context.next = 14;
                break;

              case 10:
                _context.prev = 10;
                _context.t0 = _context['catch'](6);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 14:
                _context.prev = 14;
                _context.prev = 15;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 17:
                _context.prev = 17;

                if (!_didIteratorError) {
                  _context.next = 20;
                  break;
                }

                throw _iteratorError;

              case 20:
                return _context.finish(17);

              case 21:
                return _context.finish(14);

              case 22:

                conditionFieldKeys.forEach(function (fieldKey) {
                  if (condition[fieldKey]) {
                    condition[fieldKey] = _.mapKeys(condition[fieldKey], function (value, key) {
                      return '$' + key;
                    });
                  }
                });

                _.forOwn(model.config.fields, function (value, key) {
                  if (value instanceof _ModelRef2.default || value && value.$type instanceof _ModelRef2.default) {
                    if (!key.endsWith('Id')) {
                      key = key + 'Id';
                    }
                    if (typeof condition[key] !== 'undefined') {
                      if (dbModel.options.underscored) {
                        var underscoredKey = _StringHelper2.default.toUnderscoredName(key);
                        if (underscoredKey !== key) {
                          condition[underscoredKey] = condition[key];
                          delete condition[key];
                        }
                      }
                    }
                  }
                });

                include = [];

                if (!(args && args.keywords)) {
                  _context.next = 49;
                  break;
                }

                _args$keywords = args.keywords, fields = _args$keywords.fields, value = _args$keywords.value;
                keywordsCondition = [];

                associationType = function associationType(model, fieldName) {
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                    for (var _iterator2 = model.config.associations.hasOne[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var config = _step2.value;

                      if (_.get(config, 'options.as') === fieldName) {
                        return config.target;
                      }
                    }
                  } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                      }
                    } finally {
                      if (_didIteratorError2) {
                        throw _iteratorError2;
                      }
                    }
                  }

                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                    for (var _iterator3 = model.config.associations.belongsTo[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var _config = _step3.value;

                      if (_.get(_config, 'options.as') === fieldName) {
                        return _config.target;
                      }
                    }
                  } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                      }
                    } finally {
                      if (_didIteratorError3) {
                        throw _iteratorError3;
                      }
                    }
                  }

                  return null;
                };

                _iteratorNormalCompletion4 = true;
                _didIteratorError4 = false;
                _iteratorError4 = undefined;
                _context.prev = 32;

                for (_iterator4 = fields[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  field = _step4.value;

                  if (field.indexOf('.') !== -1) {
                    fieldName = field.split('.')[0];
                    type = associationType(model, fieldName);

                    if (type) {
                      include.push({
                        model: dbModel.sequelize.models[type],
                        as: fieldName,
                        required: false
                      });
                      colFieldName = field;

                      if (dbModel.options.underscored) {
                        colFieldName = fieldName + _StringHelper2.default.toUnderscoredName(field.substr(field.indexOf('.')));
                      }
                      keywordsCondition.push(_sequelize2.default.where(_sequelize2.default.col(colFieldName), { $like: '%' + value + '%' }));
                    } else {
                      keywordsCondition.push(_defineProperty({}, field, { $like: '%' + value + '%' }));
                    }
                  } else {
                    keywordsCondition.push(_defineProperty({}, field, { $like: '%' + value + '%' }));
                  }
                }
                _context.next = 40;
                break;

              case 36:
                _context.prev = 36;
                _context.t1 = _context['catch'](32);
                _didIteratorError4 = true;
                _iteratorError4 = _context.t1;

              case 40:
                _context.prev = 40;
                _context.prev = 41;

                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                  _iterator4.return();
                }

              case 43:
                _context.prev = 43;

                if (!_didIteratorError4) {
                  _context.next = 46;
                  break;
                }

                throw _iteratorError4;

              case 46:
                return _context.finish(43);

              case 47:
                return _context.finish(40);

              case 48:
                condition.$or = keywordsCondition;

              case 49:
                return _context.abrupt('return', _index2.default.Connection.resolve(dbModel, _extends({}, args, { condition: condition, include: include })));

              case 50:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[6, 10, 14, 22], [15,, 17, 21], [32, 36, 40, 48], [41,, 43, 47]]);
      }));

      function resolve(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return resolve;
    }()
  };
}