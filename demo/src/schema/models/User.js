// @flow
import SG from '../../../../src/index'

export default SG.model('User', {
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
  target: 'Todo',
  options: {
    as: 'dueTodos',
    foreignKey: 'ownerId',
    scope: {
      completed: false
    },
    sort: [{field: 'createdAt', order: 'DESC'}]
  }
}).hasOne({
  target: 'UserProfile',
  options: {
    as: 'profile',
    foreignKey: 'ownerId'
  }
})
