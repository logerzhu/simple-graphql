'use strict';

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _Connection = require('./Connection');

var _Connection2 = _interopRequireDefault(_Connection);

var _ModelRef = require('./ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }