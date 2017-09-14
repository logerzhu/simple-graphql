// @flow
import SG from '../../../'

export default SG.schema('User', {
  description: '用户',
  plugin: {
    addMutation: true,
    singularQuery: true,
    pluralQuery: true
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
})
