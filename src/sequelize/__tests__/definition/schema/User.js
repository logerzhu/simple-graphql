// @flow
import SG from '../../../../'
import resolveConnection from '../resolveConnection'

export default SG.schema('User', {
  description: '用户',
  plugin: {
    addMutation: true,
    singularQuery: true,
    pluralQuery: true
  },
  table: {
    paranoid: true
  }
}).fields({
  userName: {
    $type: String,
    required: true
  },
  password: {
    $type: String,
    required: true
  },

  blocked: {
    $type: Boolean,
    default: false
  },
  registerAt: {
    $type: Date,
    default: () => new Date()
  }
}).hasMany({
  dueTodos: {
    target: 'Todo',
    foreignField: 'owner',
    scope: {
      completed: false
    },
    sort: [{field: 'createdAt', order: 'DESC'}]
  }
}).hasOne({
  profile: {
    target: 'UserProfile',
    foreignField: 'owner'
  }
}).queries({
  listUsers: {
    $type: 'UserConnection',
    resolve: async function ({after, first, before, last}, context, info, {sequelize}) {
      let conditionSql = ' from Users'

      const replacements:any = {}

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
    resolve: async function ({after, first, before, last}, context, info, {sequelize}) {
      let conditionSql = ' from UserProfiles'

      const replacements:any = {}

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
