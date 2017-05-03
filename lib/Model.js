'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Model = function () {
  function Model(name) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Model);

    this.name = name;
    this.config = {
      fields: {},
      associations: {
        hasOne: [],
        belongsTo: [],
        hasMany: [],
        belongsToMany: []
      },
      options: options,
      queries: {},
      mutations: {},
      methods: {},
      statics: {}
    };
  }

  _createClass(Model, [{
    key: 'fields',
    value: function (_fields) {
      function fields(_x) {
        return _fields.apply(this, arguments);
      }

      fields.toString = function () {
        return _fields.toString();
      };

      return fields;
    }(function (fields) {
      this.config.fields = Object.assign(this.config.fields, fields);
      return this;
    })
  }, {
    key: 'queries',
    value: function (_queries) {
      function queries(_x2) {
        return _queries.apply(this, arguments);
      }

      queries.toString = function () {
        return _queries.toString();
      };

      return queries;
    }(function (queries) {
      this.config.queries = Object.assign(this.config.queries, queries);
      return this;
    })
  }, {
    key: 'mutations',
    value: function (_mutations) {
      function mutations(_x3) {
        return _mutations.apply(this, arguments);
      }

      mutations.toString = function () {
        return _mutations.toString();
      };

      return mutations;
    }(function (mutations) {
      this.config.mutations = Object.assign(this.config.mutations, mutations);
      return this;
    })
  }, {
    key: 'methods',
    value: function (_methods) {
      function methods(_x4) {
        return _methods.apply(this, arguments);
      }

      methods.toString = function () {
        return _methods.toString();
      };

      return methods;
    }(function (methods) {
      this.config.methods = Object.assign(this.config.methods, methods);
      return this;
    })
  }, {
    key: 'statics',
    value: function (_statics) {
      function statics(_x5) {
        return _statics.apply(this, arguments);
      }

      statics.toString = function () {
        return _statics.toString();
      };

      return statics;
    }(function (statics) {
      this.config.statics = Object.assign(this.config.statics, statics);
      return this;
    })
  }, {
    key: 'hasOne',
    value: function hasOne(config) {
      this.config.associations.hasOne.push(config);
      return this;
    }
  }, {
    key: 'belongsTo',
    value: function belongsTo(config) {
      this.config.associations.belongsTo.push(config);
      return this;
    }
  }, {
    key: 'hasMany',
    value: function hasMany(config) {
      this.config.associations.hasMany.push(config);
      return this;
    }
  }, {
    key: 'belongsToMany',
    value: function belongsToMany(config) {
      this.config.associations.belongsToMany.push(config);
      return this;
    }
  }]);

  return Model;
}();

exports.default = Model;