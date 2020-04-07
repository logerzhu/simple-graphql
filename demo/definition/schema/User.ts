import SG from '../../../src'

export default SG.schema('User', {
  description: '用户',
  plugin: {
    addMutation: true,
    singularQuery: true,
    pluralQuery: {
      conditionFields: {
        passwordLike: {
          $type: new Set(['A', 'B']),
          mapper: function ({
            where,
            attributes
          }, argValue, sgContext) {
            if (argValue) {
              where.$and = where.$and || []
              where.password = { $like: `%${argValue}%` }
            }
          }
        }
      }
    }
  },
  tableOptions: {
    paranoid: true
  }
}).fields({
  userName: {
    $type: 'String',
    required: true
  },
  password: {
    $type: 'String',
    required: true
  },
  tags: {
    $type: ['String'],
    required: false
  },
  blocked: {
    $type: 'Boolean',
    required: false,
    default: false
  },
  registerAt: {
    $type: 'Date',
    required: false,
    default: () => new Date()
  }
}).links({
  node: {
    $type: 'NodeInterface',
    dependentFields: ['id'],
    resolve: async function (root, args, context, info, {
      models: {
        User
      }
    }) {
      return User.findOne()
    }
  },
  p1: {
    $type: 'String',
    dependentFields: ['p2', 'blocked'],
    resolve: async function ({
      password,
      blocked
    }) {
      return password + ',' + blocked
    }
  },
  p2: {
    $type: 'JSON',
    dependentFields: ['dueTodos.title'],
    resolve: async function ({
      dueTodos
    }) {
      return dueTodos.map(t => t.title)
    }
  }
}).hasMany({
  dueTodos: {
    target: 'Todo',
    foreignField: 'owner',
    scope: {
      completed: false
    },
    // conditionFields: {
    //  completed: 'Boolean',
    //  keyword: {
    //    $type: 'String',
    //    mapper: function ({where}, argValue, sgContext) {
    //      if (argValue) {
    //        where.$and = where.$and || []
    //        where.$and.push({$or: [{title: {$like: `%${argValue}%`}, description: {$like: `%${argValue}%`}}]})
    //      }
    //    }
    //  }
    // },
    order: [['owner.profile.realName', 'DESC'], ['createdAt', 'DESC']],
    outputStructure: 'Array'
  },
  dueTodos2: {
    target: 'Todo',
    foreignField: 'owner',
    scope: {
      completed: false
    },
    order: [['owner.profile.realName', 'DESC'], ['createdAt', 'DESC']]
  },
  dueTodos3: {
    target: 'Todo',
    foreignField: 'owner',
    scope: {
      completed: false
    },
    order: [['id', 'DESC']]
  }
}).hasOne({
  profile: {
    target: 'UserProfile',
    foreignField: 'owner'
  }
})
