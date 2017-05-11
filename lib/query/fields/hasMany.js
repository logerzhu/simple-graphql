'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = hasManyFieldsConfig;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _Model = require('../../Model');

var _Model2 = _interopRequireDefault(_Model);

var _ModelRef = require('../../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _Connection = require('../../Connection');

var _Connection2 = _interopRequireDefault(_Connection);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function hasManyFieldsConfig(model) {
  var config = {};
  var name = _StringHelper2.default.toInitialLowerCase(model.name);
  // Conver model association to field config
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var hasManyCfg = _step.value;

      if (hasManyCfg.hidden) {
        return 'continue';
      }
      var fieldName = _.get(hasManyCfg, 'options.as', name + 's');
      config[fieldName] = {
        $type: _Connection2.default.connectionType(new _ModelRef2.default(hasManyCfg.target)),
        args: _extends({}, _Connection2.default.args),
        resolve: function () {
          var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(root, args, context, info, models) {
            var condition, sort, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, item;

            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    condition = _extends({}, _.get(hasManyCfg, 'options.scope', {}));
                    sort = _.get(hasManyCfg, 'options.sort', [{ field: 'id', order: 'ASC' }]);

                    if (!models[hasManyCfg.target].options.underscored) {
                      _context.next = 25;
                      break;
                    }

                    condition[_.get(hasManyCfg, 'options.foreignKey', name + 'Id').replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLocaleLowerCase()] = root.id;
                    _iteratorNormalCompletion2 = true;
                    _didIteratorError2 = false;
                    _iteratorError2 = undefined;
                    _context.prev = 7;
                    for (_iterator2 = sort[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      item = _step2.value;

                      item.field = item.field.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLocaleLowerCase();
                    }
                    _context.next = 15;
                    break;

                  case 11:
                    _context.prev = 11;
                    _context.t0 = _context['catch'](7);
                    _didIteratorError2 = true;
                    _iteratorError2 = _context.t0;

                  case 15:
                    _context.prev = 15;
                    _context.prev = 16;

                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                      _iterator2.return();
                    }

                  case 18:
                    _context.prev = 18;

                    if (!_didIteratorError2) {
                      _context.next = 21;
                      break;
                    }

                    throw _iteratorError2;

                  case 21:
                    return _context.finish(18);

                  case 22:
                    return _context.finish(15);

                  case 23:
                    _context.next = 26;
                    break;

                  case 25:
                    condition[_.get(hasManyCfg, 'options.foreignKey', name + 'Id')] = root.id;

                  case 26:
                    return _context.abrupt('return', _Connection2.default.resolve(models[hasManyCfg.target], _extends({}, args, { condition: condition, sort: sort })));

                  case 27:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this, [[7, 11, 15, 23], [16,, 18, 22]]);
          }));

          function resolve(_x, _x2, _x3, _x4, _x5) {
            return _ref.apply(this, arguments);
          }

          return resolve;
        }()
      };
    };

    for (var _iterator = model.config.associations.hasMany[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ret = _loop();

      if (_ret === 'continue') continue;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return config;
}