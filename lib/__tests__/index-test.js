'use strict';

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var sequelize = new _sequelize2.default('test1', 'test', 'Welcome1', {
  host: 'localhost',
  port: 5432,
  dialect: 'sqlite',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  // SQLite only
  storage: 'test.sqlite'
});

var UserData = sequelize.define('UserData', {
  id: { type: _sequelize2.default.INTEGER, primaryKey: true },
  data: {
    type: _sequelize2.default.JSONB
  }
});

var User = sequelize.define('user', {
  firstName: {
    type: _sequelize2.default.STRING
  },
  lastName: {
    type: _sequelize2.default.STRING
  }
  // dataId: {
  //  type: Sequelize.INTEGER,
  //  references: {
  //    // This is a reference to another model
  //    model: UserData,
  //
  //    // This is the column name of the referenced model
  //    key: 'id'
  //  }
  // }
});

(function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            User.belongsTo(UserData, { as: 'data' });

            _context.next = 3;
            return sequelize.sync({ force: true });

          case 3:
            _context.next = 5;
            return UserData.create({
              id: 1,
              data: ['A', 'B']
            });

          case 5:
            _context.next = 7;
            return User.create({
              firstName: 'John',
              lastName: 'Hancock',
              dataId: 1
            });

          case 7:
            _context.next = 9;
            return User.create({
              firstName: 'John2',
              lastName: 'Hancock'
            });

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function init() {
    return _ref.apply(this, arguments);
  }

  return init;
})()().then(function () {});