// @flow
import SG from '../../../../src/index'

export default SG.schema('User', {
  description: '用户'
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
    defaultValue: false
  },
  registerAt: Date
}).hasMany({
  dueTodos1:{
    target: 'Todo',
    as: 'dueTodos2',
    foreignKey: 'ownerId',
    scope: {
      completed: false
    },
    sort: [{field: 'createdAt', order: 'DESC'}]
  }
}).hasOne({
  profile1:{
    target: 'UserProfile',
    as: 'profile',
    foreignKey: 'ownerId'
  }
})


