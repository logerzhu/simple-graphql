// @flow
import SG from '../../../../'
import resolveConnection from '../resolveConnection'

export default SG.schema('User', {
  description: '用户',
  plugin: {
    addMutation: true,
    singularQuery: true,
    pluralQuery: {
      // conditionFields: {
      //   passwordLike: {
      //     $type: ['A', 'B'],
      //     mapper: function ({ where, attributes }, argValue, sgContext) {
      //       if (argValue) {
      //         where.$and = where.$and || []
      //         where['password'] = { $like: `%${argValue}%` }
      //       }
      //     }
      //   }
      // }
    }
  },
  table: {
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
    $type: '[String]'
  },
  blocked: {
    $type: 'Boolean',
    default: false
  },
  registerAt: {
    $type: 'Date',
    default: () => new Date()
  }
}).links({
  p1: {
    $type: 'String',
    dependentFields: ['p2', 'blocked'],
    resolve: async function ({ password, blocked }) {
      return password + ',' + blocked
    }
  },
  p2: {
    $type: 'JSON',
    dependentFields: ['dueTodos.title'],
    resolve: async function ({ dueTodos }) {
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
}).queries({
  listUsers: {
    $type: 'UserConnection',
    resolve: async function ({ after, first, before, last }, context, info, { sequelize }) {
      let conditionSql = ' from Users'

      const replacements: any = {}

      return resolveConnection(sequelize, 'User', {
        after: after,
        first: first,
        before: before,
        last: last,
        conditionSql: conditionSql,
        orderBySql: ' order by Users.id DESC',
        replacements: replacements
      })
    }
  },
  listProfiles: {
    $type: 'UserProfileConnection',
    resolve: async function ({ after, first, before, last }, context, info, { sequelize }) {
      let conditionSql = ' from UserProfiles'

      const replacements: any = {}

      return resolveConnection(sequelize, 'UserProfile', {
        after: after,
        first: first,
        before: before,
        last: last,
        conditionSql: conditionSql,
        orderBySql: ' order by UserProfiles.id DESC',
        replacements: replacements
      })
    }
  }
})
