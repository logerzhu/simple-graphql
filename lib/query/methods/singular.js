'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = singularQuery;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _Model = require('../../Model');

var _Model2 = _interopRequireDefault(_Model);

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function singularQuery(model) {
  var name = _StringHelper2.default.toInitialLowerCase(model.name);
  var searchFields = {
    id: {
      $type: _index2.default.modelRef(model.name),
      description: 'Id of Model ' + model.name
    }
  };
  _.forOwn(model.config.fields, function (value, key) {
    if (!value['$type'] || value['searchable'] !== false && value['hidden'] !== true && !value['resolve']) {
      if (value['unique']) {
        searchFields[key] = Object.assign({}, value, { required: false });
      }
    }
  });

  return {
    name: name,
    $type: _index2.default.modelRef(model.name),
    args: searchFields,
    resolve: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args, context, info, models) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', models[model.name].findOne({
                  where: _extends({}, args)
                }));

              case 1:
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