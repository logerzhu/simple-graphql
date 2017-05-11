'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addMutation;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _Model = require('../../Model');

var _Model2 = _interopRequireDefault(_Model);

var _ModelRef = require('../../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function addMutation(model) {
  var name = 'add' + _StringHelper2.default.toInitialUpperCase(model.name);
  var addedName = 'added' + _StringHelper2.default.toInitialUpperCase(model.name) + 'Edge';

  var config = {};
  _lodash2.default.forOwn(model.config.fields, function (value, key) {
    if (value instanceof _ModelRef2.default || value && value.$type instanceof _ModelRef2.default) {
      if (!key.endsWith('Id')) {
        key = key + 'Id';
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.initializable !== false) {
        config[key] = value;
      }
    } else {
      config[key] = value;
    }
  });
  return {
    name: name,
    inputFields: config,
    outputFields: _defineProperty({}, addedName, _index2.default.Connection.edgeType(_index2.default.modelRef(model.name))),
    mutateAndGetPayload: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args, context, info, models) {
        var dbModel, attrs, instance;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dbModel = models[model.name];
                attrs = {};


                _lodash2.default.forOwn(model.config.fields, function (value, key) {
                  if (value instanceof _ModelRef2.default || value && value.$type instanceof _ModelRef2.default) {
                    if (!key.endsWith('Id')) {
                      key = key + 'Id';
                    }
                    if (typeof args[key] !== 'undefined') {
                      if (dbModel.options.underscored) {
                        attrs[_StringHelper2.default.toUnderscoredName(key)] = args[key];
                      } else {
                        attrs[key] = args[key];
                      }
                    }
                  } else if (typeof args[key] !== 'undefined') {
                    attrs[key] = args[key];
                  }
                });

                _context.next = 5;
                return dbModel.create(attrs);

              case 5:
                instance = _context.sent;
                return _context.abrupt('return', _defineProperty({}, addedName, {
                  node: instance,
                  cursor: instance.id
                }));

              case 7:
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