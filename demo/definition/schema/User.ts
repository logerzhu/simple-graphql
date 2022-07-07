import {SequelizeSGSchema} from '../../../src'

export default new SequelizeSGSchema('User', {
  description: '用户',
  plugin: {
    addMutation: {
      enable: true
    },
    singularQuery: {
      enable: true
    },
    pluralQuery: {
      enable: true,
      conditionFields: {
        passwordLike: {
          enum: ['A', 'B'],
          metadata: {
            graphql: {
              mapper: function ({
                                  where,
                                  attributes
                                }, argValue, sgContext) {
                if (argValue) {
                  where.$and = where.$and || []
                  where.password = {$like: `%${argValue}%`}
                }
              }
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
    type: 'String',
    nullable: false
  },
  password: {
    type: 'String',
    nullable: false
  },
  tags: {
    elements: {type: 'String'},
    nullable: true
  },
  blocked: {
    type: 'Boolean',
    nullable: true,
    metadata: {
      column: {defaultValue: false}
    }
  },
  registerAt: {
    type: 'Date',
    nullable: true,
    metadata: {
      column: {defaultValue: () => new Date()}
    }
  }
}).links({
  node: {
    output: {type: 'NodeInterface'},
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
    output: {type: 'String'},
    dependentFields: ['blocked'],
    resolve: async function ({
                               password,
                               blocked
                             }) {
      return password + ',' + blocked
    }
  },
  p2: {
    output: {type: 'JSON'},
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
