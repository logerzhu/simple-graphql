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
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(dbModel, args) {
      var after, _args$first, first, before, last, _args$include, include, _args$condition, condition, _args$sort, sort, reverse, count, offset, result, index;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              after = args.after, _args$first = args.first, first = _args$first === undefined ? 100 : _args$first, before = args.before, last = args.last, _args$include = args.include, include = _args$include === undefined ? [] : _args$include, _args$condition = args.condition, condition = _args$condition === undefined ? {} : _args$condition, _args$sort = args.sort, sort = _args$sort === undefined ? [{
                field: 'id',
                order: 'ASC'
              }] : _args$sort;
              reverse = false;
              _context.next = 4;
              return dbModel.count({
                include: include,
                where: condition
              });

            case 4:
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
              _context.next = 9;
              return dbModel.findAll({
                include: include,
                where: condition,
                order: sort.map(function (s) {
                  return [s.field, s.order];
                }),
                limit: first,
                offset: offset
              });

            case 9:
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

            case 12:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function resolve(_x, _x2) {
      return _ref.apply(this, arguments);
    }

    return resolve;
  }()
};