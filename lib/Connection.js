'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EdgeType = exports.ConnectionType = undefined;

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _ModelRef = require('./ModelRef');

var _ModelRef2 = _interopRequireDefault(_ModelRef);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConnectionType = exports.ConnectionType = function ConnectionType(nodeType) {
  _classCallCheck(this, ConnectionType);

  this.nodeType = nodeType;
};

var EdgeType = exports.EdgeType = function EdgeType(nodeType) {
  _classCallCheck(this, EdgeType);

  this.nodeType = nodeType;
};

/**
 * Relay Connection Helper
 *
 * @example
 * import SG from 'simple-graphql'
 * const UserType = GS.modelRef('User')
 * export default GS.model('User', {}).fields({
 *   firstName: String,
 *   lastName: String
 * }).queries({
 *   searchUsers: {
 *     description: 'Search users by firstName',
 *     $type: GS.Connection.connectionType(UserType),
 *     args: {
 *       ...GS.Connection.args,
 *       condition: {
 *         firstName: String
 *       }
 *     },
 *     resolve: async function (args, context, info, {User}) {
 *       return GS.Connection.resolve(User, args)
 *     }
 *   }
 * })
 */


exports.default = {

  ConnectionType: ConnectionType,

  EdgeType: EdgeType,

  /**
   * Reference to relay ConnectionType with specify node
   */
  connectionType: function connectionType(nodeType) {
    return new this.ConnectionType(nodeType);
  },


  /**
   * Reference to Relay EdgeType with specify node
   */
  edgeType: function edgeType(nodeType) {
    return new this.EdgeType(nodeType);
  },


  /**
   * Return Relay Connection args definition.
   */
  args: {
    after: {
      $type: String,
      description: '返回的记录应该在cursor:after之后'
    },
    first: {
      $type: Number,
      description: '指定最多返回记录的数量'
    },
    before: {
      $type: String
    },
    last: {
      $type: Number
    }
  },

  /**
   * Query the model with specify args and return the connection data
   */
  resolve: function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(model, args) {
      var after, _args$first, first, before, last, _args$condition, condition, _args$sort, sort, keywords, reverse, _fields, _value, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _field, count, offset, result, index;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              after = args.after, _args$first = args.first, first = _args$first === undefined ? 100 : _args$first, before = args.before, last = args.last, _args$condition = args.condition, condition = _args$condition === undefined ? {} : _args$condition, _args$sort = args.sort, sort = _args$sort === undefined ? [{ field: 'id', order: 'ASC' }] : _args$sort, keywords = args.keywords;
              reverse = false;

              if (!keywords) {
                _context.next = 23;
                break;
              }

              _fields = keywords.fields, _value = keywords.value;
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 7;

              for (_iterator = _fields[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                _field = _step.value;

                condition[_field] = { $like: '%' + _value + '%' };
              }
              _context.next = 15;
              break;

            case 11:
              _context.prev = 11;
              _context.t0 = _context['catch'](7);
              _didIteratorError = true;
              _iteratorError = _context.t0;

            case 15:
              _context.prev = 15;
              _context.prev = 16;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 18:
              _context.prev = 18;

              if (!_didIteratorError) {
                _context.next = 21;
                break;
              }

              throw _iteratorError;

            case 21:
              return _context.finish(18);

            case 22:
              return _context.finish(15);

            case 23:
              _context.next = 25;
              return model.count({
                where: condition
              });

            case 25:
              count = _context.sent;


              if (last || before) {
                reverse = true;
                first = last || 100;
                after = count - (parseInt(before) - 1);
                sort = sort.map(function (s) {
                  return {
                    field: s.field,
                    order: s.order === 'ASC' ? 'DESC' : 'ASC'
                  };
                });
              }
              offset = Math.max(after != null ? parseInt(after) : 0, 0);
              _context.next = 30;
              return model.findAll({
                where: condition,
                order: sort.map(function (s) {
                  return [s.field, s.order];
                }),
                limit: first,
                offset: offset
              });

            case 30:
              result = _context.sent;
              index = 0;
              return _context.abrupt('return', {
                pageInfo: {
                  hasPreviousPage: offset > 0,
                  hasNextPage: offset + result.length < count
                },
                edges: reverse ? result.map(function (node) {
                  return {
                    node: node,
                    cursor: count - (offset + index++)
                  };
                }).reverse() : result.map(function (node) {
                  return {
                    node: node,
                    cursor: offset + ++index
                  };
                }),
                count: count
              });

            case 33:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[7, 11, 15, 23], [16,, 18, 22]]);
    }));

    function resolve(_x, _x2) {
      return _ref.apply(this, arguments);
    }

    return resolve;
  }()
};