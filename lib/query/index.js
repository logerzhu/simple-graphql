'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _singular = require('./methods/singular');

var _singular2 = _interopRequireDefault(_singular);

var _plural = require('./methods/plural');

var _plural2 = _interopRequireDefault(_plural);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  singularQuery: _singular2.default,
  pluralQuery: _plural2.default
};