'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = updateMutation;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _Model = require('../../Model');

var _Model2 = _interopRequireDefault(_Model);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _ModelRef = require('../../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function updateMutation(model) {
  var name = 'update' + _StringHelper2.default.toInitialUpperCase(model.name);
  var changedName = 'changed' + _StringHelper2.default.toInitialUpperCase(model.name);

  var config = {
    id: {
      $type: _index2.default.modelRef(model.name),
      required: true
    },
    values: {}
  };
  _lodash2.default.forOwn(model.config.fields, function (value, key) {
    if (value instanceof _ModelRef2.default || value && value.$type instanceof _ModelRef2.default) {
      if (!key.endsWith('Id')) {
        key = key + 'Id';
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.mutable !== false) {
        config.values[key] = _extends({}, value, { required: false, default: null });
      }
    } else {
      config.values[key] = value;
    }
  });

  return {
    name: name,
    inputFields: config,
    outputFields: _defineProperty({}, changedName, _index2.default.modelRef(model.name)),
    mutateAndGetPayload: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args, context, info, models) {
        var dbModel, values, instance;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(args == null || args.values == null)) {
                  _context.next = 2;
                  break;
                }

                throw new Error('Missing update values.');

              case 2:
                dbModel = models[model.name];
                values = {};


                _lodash2.default.forOwn(model.config.fields, function (value, key) {
                  if (value instanceof _ModelRef2.default || value && value.$type instanceof _ModelRef2.default) {
                    if (!key.endsWith('Id')) {
                      key = key + 'Id';
                    }
                    if (typeof args.values[key] !== 'undefined') {
                      if (dbModel.options.underscored) {
                        values[_StringHelper2.default.toUnderscoredName(key)] = args.values[key];
                      } else {
                        values[key] = args.values[key];
                      }
                    }
                  } else if (typeof args.values[key] !== 'undefined') {
                    values[key] = args.values[key];
                  }
                });

                _context.next = 7;
                return dbModel.findOne({ where: { id: args.id } });

              case 7:
                instance = _context.sent;

                if (instance) {
                  _context.next = 12;
                  break;
                }

                throw new Error(model.name + '[' + args.id + '] not exist.');

              case 12:
                _context.next = 14;
                return instance.update(values);

              case 14:
                return _context.abrupt('return', _defineProperty({}, changedName, instance));

              case 15:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function mutateAndGetPayload(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return mutateAndGetPayload;
    }()
  };
}