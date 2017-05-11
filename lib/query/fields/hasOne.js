'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = hasOneFieldsConfig;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _Model = require('../../Model');

var _Model2 = _interopRequireDefault(_Model);

var _ModelRef = require('../../ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function hasOneFieldsConfig(model) {
  var config = {};
  // Conver model association to field config
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var hasOneCfg = _step.value;

      if (hasOneCfg.hidden) {
        return 'continue';
      }
      var fieldName = _.get(hasOneCfg, 'options.as', hasOneCfg.target);
      config[fieldName] = {
        $type: new _ModelRef2.default(hasOneCfg.target),
        resolve: function () {
          var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(root, args, context, info, models) {
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!(root[fieldName] != null)) {
                      _context.next = 4;
                      break;
                    }

                    return _context.abrupt('return', root[fieldName]);

                  case 4:
                    return _context.abrupt('return', root['get' + _StringHelper2.default.toInitialUpperCase(fieldName)]());

                  case 5:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          function resolve(_x, _x2, _x3, _x4, _x5) {
            return _ref.apply(this, arguments);
          }

          return resolve;
        }()
      };
    };

    for (var _iterator = model.config.associations.hasOne[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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