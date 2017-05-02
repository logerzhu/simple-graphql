'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _add = require('./methods/add');

var _add2 = _interopRequireDefault(_add);

var _delete = require('./methods/delete');

var _delete2 = _interopRequireDefault(_delete);

var _update = require('./methods/update');

var _update2 = _interopRequireDefault(_update);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  addMutation: _add2.default,
  deleteMutation: _delete2.default,
  updateMutation: _update2.default
};